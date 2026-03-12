import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!;
const MODEL = 'gemini-2.5-flash';
const FREE_LIMIT = 3;
const SPROUT_COST = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    // ── 1. Auth ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // ── 2. Parse request ──
    const { message, conversation_id, mode = 'general', round = 1, meta } = await req.json();
    const today = new Date().toISOString().slice(0, 10);
    const isGreeting = meta?.type === 'greeting';
    const isTarotCards = meta?.type === 'tarot_cards';
    const isPaidMode = mode === 'saju' || mode === 'tarot';

    // ── 3. Get or create conversation ──
    let convId = conversation_id;
    let convFreeUsed = 0; // 현재 conversation의 free_messages_used (DB 저장용)

    if (convId) {
      const { data: conv } = await supabase
        .from('mind_talk_conversations')
        .select('free_messages_used')
        .eq('id', convId)
        .single();
      convFreeUsed = conv?.free_messages_used ?? 0;
    } else {
      const { data: existing } = await supabase
        .from('mind_talk_conversations')
        .select('id, free_messages_used')
        .eq('user_id', userId)
        .eq('session_date', today)
        .eq('mode', mode)
        .eq('round', round)
        .maybeSingle();

      if (existing) {
        convId = existing.id;
        convFreeUsed = existing.free_messages_used;
      } else {
        const { data: newConv } = await supabase
          .from('mind_talk_conversations')
          .insert({ user_id: userId, session_date: today, mode, round })
          .select('id')
          .single();
        convId = newConv!.id;
      }
    }

    // ── 4. Limit & sprout check (paid modes only, 하루 기준 서버 검증) ──
    let sproutDeducted = false;
    let newSproutBalance = -1; // 차감 후 잔액 (차감 시에만 사용)
    let dailyFreeUsed = 0; // 오늘 해당 모드의 일일 무료 사용 합계 (클라이언트 전달용)
    if (isPaidMode && !isGreeting) {
      // 오늘 해당 모드의 전체 무료 사용량 집계 (라운드 무관, 서버 기반)
      const { data: todayConvs } = await supabase
        .from('mind_talk_conversations')
        .select('free_messages_used')
        .eq('user_id', userId)
        .eq('session_date', today)
        .eq('mode', mode);
      dailyFreeUsed = todayConvs?.reduce((sum, c) => sum + (c.free_messages_used ?? 0), 0) ?? 0;

      if (dailyFreeUsed >= FREE_LIMIT) {
        // Check sprout balance
        const { data: userData } = await supabase
          .from('users')
          .select('sprout_balance')
          .eq('id', userId)
          .single();

        const balance = userData?.sprout_balance ?? 0;
        if (balance < SPROUT_COST) {
          return new Response(JSON.stringify({
            error: 'INSUFFICIENT_SPROUTS',
            current_balance: balance,
            required: SPROUT_COST,
          }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Deduct sprouts (optimistic lock)
        const { data: deductResult, error: deductErr } = await supabase
          .from('users')
          .update({ sprout_balance: balance - SPROUT_COST })
          .eq('id', userId)
          .eq('sprout_balance', balance)
          .select('sprout_balance')
          .single();

        if (deductErr || !deductResult) {
          return new Response(JSON.stringify({ error: 'SPROUT_DEDUCTION_FAILED' }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Record transaction (fire-and-forget, 응답 흐름 블로킹 불필요)
        supabase.from('sprout_transactions').insert({
          user_id: userId,
          transaction_type: 'deduct',
          amount: SPROUT_COST,
          balance_before: balance,
          balance_after: balance - SPROUT_COST,
          description: `마음톡 ${mode === 'saju' ? '사주' : '타로'} 상담`,
        });

        sproutDeducted = true;
        newSproutBalance = deductResult.sprout_balance;
      }
    }

    // ── 5. Save user message ──
    if (message) {
      await supabase.from('mind_talk_messages').insert({
        conversation_id: convId, user_id: userId, role: 'user', content: message,
        is_paid: sproutDeducted,
      });
    }

    // Save tarot cards info as a system-like user message
    if (isTarotCards && meta?.cards) {
      const cardText = `[타로 카드 선택] ${meta.cards.join(', ')}`;
      await supabase.from('mind_talk_messages').insert({
        conversation_id: convId, user_id: userId, role: 'user', content: cardText,
      });
    }

    // ── 6. Load context (병렬화) ──
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // 모드별 추가 병렬 조회
    const sajuRecordPromise = mode === 'saju'
      ? supabase.from('saju_records').select('full_name, gender, birth_date, birth_time').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : null;
    // 나다움 분석 요약 (전 모드 개인화)
    const nadaumPromise = supabase.from('nadaum_analyses').select('category, analysis_text').eq('user_id', userId);

    const [primarySajuResult, tagsResult, summariesResult, historyResult, sajuRecordResult, nadaumResult] = await Promise.all([
      supabase.from('saju_records').select('full_name').eq('user_id', userId).eq('is_primary', true).maybeSingle(),
      supabase.from('user_trait_tags').select('tag_name, sentiment, count').eq('user_id', userId).order('count', { ascending: false }).limit(15),
      supabase.from('user_situation_summaries').select('situation_summary, created_at').eq('user_id', userId).gte('created_at', fourWeeksAgo.toISOString()).order('created_at', { ascending: true }),
      supabase.from('mind_talk_messages').select('role, content').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(10),
      sajuRecordPromise ?? Promise.resolve(null),
      nadaumPromise,
    ]);

    const userName = primarySajuResult.data?.full_name || '';
    const tags = tagsResult.data;
    const recentSummaries = summariesResult.data;
    const history = historyResult.data;
    // DESC로 가져왔으므로 시간순 정렬
    if (history) history.reverse();

    // ── 6-1. 사주 모드: 통합 사주 API 호출 ──
    let detailedSajuInfo = '';
    if (mode === 'saju') {
      try {
        const sajuRecord = sajuRecordResult?.data;

        if (sajuRecord?.birth_date) {
          const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim();
          if (sajuApiKey) {
            const birthDateStr = sajuRecord.birth_date as string;
            const birthTimeStr = (sajuRecord.birth_time as string) || '12:00';

            const datePart = birthDateStr.includes('T') ? birthDateStr.split('T')[0] : birthDateStr.split(' ')[0];
            const dateOnly = datePart.replace(/-/g, '');
            const timeOnly = birthTimeStr.replace(/:/g, '').substring(0, 4);
            const birthday = dateOnly + timeOnly;

            const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=false&gender=${sajuRecord.gender}&apiKey=${sajuApiKey}`;

            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const sajuResponse = await fetch(sajuApiUrl, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Host': 'service.stargio.co.kr:8400',
                    'Origin': 'https://nadaunse.com',
                    'Referer': 'https://nadaunse.com/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'cross-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                  },
                });

                if (!sajuResponse.ok) throw new Error(`사주 API HTTP 오류: ${sajuResponse.status}`);

                const rawText = await sajuResponse.text();
                const sajuData = JSON.parse(rawText);

                if (sajuData && Object.keys(sajuData).length > 0) {
                  // 핵심 사주 필드만 추출 (전체 JSON은 너무 커서 토큰 낭비)
                  const pick = (keys: string[]) => {
                    const obj: Record<string, unknown> = {};
                    for (const k of keys) { if (sajuData[k] !== undefined) obj[k] = sajuData[k]; }
                    return obj;
                  };
                  const essentialData = pick([
                    '격국', '격국설명', '일주', '일주설명',
                    '천간', '지지', '십성', '십이운성',
                    '대운', '대운수', '세운',
                    '발달오행', '오행비율',
                    '용신', '용신설명', '희신',
                    '성격', '적성', '건강',
                    '올해운세', '이달운세', '오늘운세',
                  ]);
                  detailedSajuInfo = `\n\n[상세 사주 데이터]\n${JSON.stringify(essentialData, null, 2)}`;
                  console.log('✅ 사주 API 호출 성공 (전체:', Object.keys(sajuData).length, '키, 추출:', Object.keys(essentialData).length, '키)');
                  break;
                }
              } catch (err) {
                console.error(`사주 API 시도 ${attempt}/3 실패:`, err);
                if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
              }
            }
          }
        } else {
          console.log('사주 정보 없음, 사주 API 호출 스킵');
        }
      } catch (err) {
        console.error('사주 API 처리 오류:', err);
      }
    }

    // ── 7. Build context strings ──
    const tagText = tags?.length
      ? tags.map(t => `#${t.tag_name}(${t.sentiment === 'positive' ? '+' : t.sentiment === 'negative' ? '-' : ''})`).join(' ')
      : '아직 없음';

    // 주차별 그룹핑 (같은 주 여러 건 → 최신 1건만)
    let situationText = '없음';
    if (recentSummaries?.length) {
      const now = new Date();
      const weekMap = new Map<number, string>();
      for (const s of recentSummaries) {
        const daysAgo = Math.floor((now.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor(daysAgo / 7) + 1;
        if (weekNum >= 1 && weekNum <= 4) {
          weekMap.set(weekNum, s.situation_summary); // ASC 순서 → 나중 것이 덮어씀 = 최신
        }
      }
      const lines: string[] = [];
      for (let w = 1; w <= 4; w++) {
        if (weekMap.has(w)) lines.push(`[${w}주 전] ${weekMap.get(w)!}`);
      }
      if (lines.length) situationText = lines.join('\n');
    }

    // ── 7-1. 나다움 분석 요약 (일반 모드) ──
    let nadaumText = '';
    if (nadaumResult?.data?.length) {
      const categoryLabel: Record<string, string> = { love: '연애', nature: '성격', money: '금전', career: '직업', health: '건강' };
      nadaumText = nadaumResult.data
        .map(a => `[${categoryLabel[a.category] || a.category}] ${a.analysis_text.slice(0, 200)}`)
        .join('\n');
    }

    // ── 8. System prompt per mode ──
    const contextBlock = `[사용자 성향 태그]
${tagText}

[사용자 심리 상황 요약 (1주 전이 가장 최근 — 최신 심리에 더 중점을 두고 상담해)]
${situationText}${nadaumText ? `\n\n[나다움 분석 요약]\n${nadaumText}` : ''}${detailedSajuInfo}`;

    const safetyRules = `- 의학적 진단, 약물 추천, 치료 조언 절대 금지
- 사용자가 자해/자살을 언급하면 즉시 안내:
  "지금 많이 힘들구나. 전문 상담사와 이야기하면 도움이 될 거야. 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199로 연락해봐."
- 법적/재무 조언 금지`;

    let systemPrompt = '';

    if (mode === 'general') {
      systemPrompt = `너는 나다운세 앱의 마음 친구 '마음이'야.
사용자의 오랜 친구처럼 편안하고 따뜻한 반말 톤으로 대화해.
평소에는 사용자의 성향 데이터를 자연스럽게 활용하되 데이터 출처를 드러내지 마.
단, 사용자가 "나에 대해 알려줘", "내 성격이 어때?" 등 자신에 대해 직접 물어보면, 아래 성향 태그와 나다움 분석 데이터를 바탕으로 친근하게 설명해줘.
${userName ? `사용자의 이름은 "${userName}"이야. 대화할 때 "${userName}아" 또는 "${userName}야"로 자연스럽게 불러줘.` : '사용자의 이름을 모르면 "너"로 불러.'}

${contextBlock}

[대화 규칙]
- 답변은 2~3문장으로 짧고 자연스럽게, 친구처럼 가볍게
- 먼저 사용자의 감정에 공감한 뒤, 따뜻한 질문을 하나 건네줘
- 공감과 경청 중심, 사용자 스스로 인사이트를 얻도록 질문으로 유도
- 첫 인사 시 사용자의 심리 상태와 성향을 바탕으로 따뜻하게 말을 걸어줘
- "~해야 한다" 식의 단정적 조언 자제
${safetyRules}

[후속 질문 생성 — 반드시 아래 형식을 정확히 지켜]
답변 본문을 먼저 완성한 후, 반드시 "---SUGGESTIONS---"를 별도 줄에 출력하고, 그 다음 줄에 질문들을 "|"로 구분해서 작성해.
사용자가 "나"의 입장에서 너(마음이)에게 이어서 물어볼 만한 짧은 질문 2~3개.
질문은 사용자의 1인칭 화법으로 작성해 (예: "요즘 왜 이렇게 예민할까?", "나한테 맞는 직업이 뭘까?").
사용자의 현재 대화 맥락과 성향 데이터를 기반으로 개인화된 질문을 만들어.
---SUGGESTIONS---
질문1|질문2|질문3`;
    } else if (mode === 'saju') {
      systemPrompt = `너는 나다운세 앱의 사주 상담사 '마음이'야.
사용자의 사주와 운세를 기반으로 따뜻하고 친근한 반말 톤으로 상담해.
제공된 상세 사주 데이터를 분석의 핵심 근거로 활용해. 특히 격국, 일주, 대운의 특성을 바탕으로 구체적인 조언을 해줘.
${userName ? `사용자의 이름은 "${userName}"이야. 대화할 때 "${userName}아" 또는 "${userName}야"로 자연스럽게 불러줘.` : '사용자의 이름을 모르면 "너"로 불러.'}

${contextBlock}

[대화 규칙]
- 답변은 3~6문장으로, 사용자의 감정에 먼저 공감한 뒤 사주 기반 인사이트를 제공해
- 사주 데이터가 있으면 반드시 활용하여 맞춤 상담 제공
- 사주 전문 용어(종살격, 상관, 편관, 대운, 오행 등)는 직접 언급하지 않고 쉬운 일상 언어로 풀어서 설명
- 사용자의 현재 고민이나 상황에 맞는 운세 해석을 제공
- 긍정적인 방향으로 안내하되 현실적으로
- 첫 인사 시 사용자의 상황을 바탕으로 오늘의 흐름이나 기운에 대해 이야기를 시작해
- "~해야 한다" 식의 단정적 조언 자제
${safetyRules}

[후속 질문 생성 — 반드시 아래 형식을 정확히 지켜]
답변 본문을 먼저 완성한 후, 반드시 "---SUGGESTIONS---"를 별도 줄에 출력하고, 그 다음 줄에 질문들을 "|"로 구분해서 작성해.
사용자가 "나"의 입장에서 너(마음이)에게 이어서 물어볼 만한 짧은 질문 2~3개.
질문은 사용자의 1인칭 화법으로 작성해 (예: "이번 달 연애운은 어때?", "내 적성에 맞는 일이 뭘까?").
사용자의 현재 대화 맥락과 사주 데이터를 기반으로 개인화된 질문을 만들어.
---SUGGESTIONS---
질문1|질문2|질문3`;
    } else if (mode === 'tarot') {
      systemPrompt = `너는 나다운세 앱의 타로 상담사 '마음이'야.
타로 카드의 의미를 기반으로 따뜻하고 신비로운 반말 톤으로 상담해.
사용자의 성향 데이터를 자연스럽게 활용해.
${userName ? `사용자의 이름은 "${userName}"이야. 대화할 때 "${userName}아" 또는 "${userName}야"로 자연스럽게 불러줘.` : '사용자의 이름을 모르면 "너"로 불러.'}

${contextBlock}

[대화 규칙]
- 답변은 3~6문장으로, 사용자의 감정에 먼저 공감한 뒤 타로 기반 인사이트를 제공해
- 타로 카드 이름은 반드시 영어 원문 그대로 사용해 (예: "Six of Pentacles", "The Tower"). 절대 한국어로 번역하지 마.
- 카드 해석: 카드 이름 + 핵심 의미 1~2문장 → 사용자 상황에 맞춘 해석 2~3문장. 길게 늘리지 마.
- 긍정적인 방향으로 안내하되 현실적으로
- 첫 인사 시 어떤 고민에 대해 카드를 뽑아볼지 물어봐
${safetyRules}

[후속 질문 생성 — 반드시 아래 형식을 정확히 지켜]
답변 본문을 먼저 완성한 후, 반드시 "---SUGGESTIONS---"를 별도 줄에 출력하고, 그 다음 줄에 질문들을 "|"로 구분해서 작성해.
사용자가 "나"의 입장에서 너(마음이)에게 이어서 물어볼 만한 짧은 질문 2~3개.
질문은 사용자의 1인칭 화법으로 작성해 (예: "이 카드가 연애에도 해당돼?", "다른 카드도 뽑아볼까?").
현재 대화 맥락에 맞는 개인화된 질문을 만들어.
---SUGGESTIONS---
질문1|질문2|질문3`;
    }

    // ── 9. Build Gemini messages ──
    const geminiMessages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history) {
      for (const h of history) {
        geminiMessages.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] });
      }
    }

    if (isGreeting && geminiMessages.length === 0) {
      const modeLabel = mode === 'general' ? '일반 대화' : mode === 'saju' ? '사주 상담' : '타로 상담';
      geminiMessages.push({
        role: 'user',
        parts: [{ text: `[시스템: 사용자가 ${modeLabel}을 시작했습니다. 사용자의 심리 상태와 성향 데이터를 바탕으로 따뜻하게 먼저 말을 걸어주세요. 이 메시지가 시스템 메시지임을 드러내지 마세요.]` }],
      });
    }

    if (isTarotCards && meta?.cards) {
      geminiMessages.push({
        role: 'user',
        parts: [{ text: `[타로 카드 선택] 사용자가 뽑은 카드: ${meta.cards.join(', ')}. ${meta.question ? `사용자의 질문/고민: "${meta.question}"` : '전반적인 운세에 대해 해석해주세요.'}` }],
      });
    }

    // ── 10. Call Gemini streaming ──
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.85, maxOutputTokens: 4000, topP: 0.95 },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    // ── 11. SSE stream to client ──
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 일일 합계 (클라이언트에 전달) + conversation 단위 (DB 저장)
    const newDailyFreeUsed = (isPaidMode && !isGreeting) ? dailyFreeUsed + 1 : dailyFreeUsed;
    const newConvFreeUsed = (isPaidMode && !isGreeting) ? convFreeUsed + 1 : convFreeUsed;

    (async () => {
      try {
        // 메타데이터 전송
        const metaPayload: Record<string, unknown> = {
          conversation_id: convId,
          free_messages_used: newDailyFreeUsed,
          mode,
        };
        if (sproutDeducted) {
          metaPayload.new_sprout_balance = newSproutBalance;
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify(metaPayload)}\n\n`));

        const reader = geminiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let sseBuffer = '';
        let suggestionsReached = false; // ---SUGGESTIONS--- 감지 후 텍스트 전송 중단
        const MARKER = '---SUGGESTIONS---';
        let holdBuffer = ''; // 부분 마커 가능성이 있는 텍스트를 보류

        const processGeminiText = async (text: string) => {
          if (!text) return;
          fullResponse += text;
          if (suggestionsReached) return; // 이미 마커 이후 → 클라이언트에 전송 안 함

          const markerIdx = fullResponse.indexOf(MARKER);
          if (markerIdx >= 0) {
            suggestionsReached = true;
            // 보류 중인 버퍼에서 마커 이전 텍스트만 전송
            const combined = holdBuffer + text;
            holdBuffer = '';
            const combStart = fullResponse.length - combined.length;
            if (markerIdx > combStart) {
              const partialText = combined.slice(0, markerIdx - combStart);
              if (partialText.trim()) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: partialText })}\n\n`));
              }
            }
          } else {
            // 부분 마커 감지: 끝에 ---S, ---SU, ---SUG... 등이 있으면 보류
            const pending = holdBuffer + text;
            const partialMatch = pending.match(/\n?---S(?:U(?:G(?:G(?:E(?:S(?:T(?:I(?:O(?:N(?:S(?:-(?:-(?:-)?)?)?)?)?)?)?)?)?)?)?)?)?$/);
            if (partialMatch) {
              const safeText = pending.slice(0, partialMatch.index);
              holdBuffer = pending.slice(partialMatch.index!);
              if (safeText) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text: safeText })}\n\n`));
              }
            } else {
              holdBuffer = '';
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: pending })}\n\n`));
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            sseBuffer += decoder.decode();
            break;
          }

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              await processGeminiText(text);
            } catch { /* ignore */ }
          }
        }

        // 남은 버퍼 처리
        if (sseBuffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(sseBuffer.slice(6).trim());
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            await processGeminiText(text);
          } catch { /* ignore */ }
        }

        // 스트림 종료 후 holdBuffer에 남은 텍스트 처리 (부분 마커가 결국 마커가 아니었을 경우)
        if (holdBuffer && !suggestionsReached) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text: holdBuffer })}\n\n`));
          holdBuffer = '';
        }

        // 후속 질문 파싱 및 전송 (전 모드)
        let cleanResponse = fullResponse;
        if (fullResponse.includes('---SUGGESTIONS---')) {
          const parts = fullResponse.split('---SUGGESTIONS---');
          cleanResponse = parts[0].trim();
          const suggestionsRaw = parts[1]?.trim();
          if (suggestionsRaw) {
            const suggestions = suggestionsRaw.split('|').map(s => s.trim()).filter(Boolean).slice(0, 3);
            if (suggestions.length > 0) {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ suggestions })}\n\n`));
            }
          }
        }

        // [DONE]을 먼저 전송하여 클라이언트 응답성 확보
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();

        // AI 응답 저장 (suggestions 제외한 본문만 저장)
        if (cleanResponse) {
          await Promise.all([
            supabase.from('mind_talk_messages').insert({
              conversation_id: convId, user_id: userId, role: 'assistant', content: cleanResponse,
              is_paid: sproutDeducted,
            }),
            supabase
              .from('mind_talk_conversations')
              .update({
                free_messages_used: newConvFreeUsed,
                message_count: (history?.length || 0) + (message ? 2 : 1),
                updated_at: new Date().toISOString(),
              })
              .eq('id', convId),
          ]);
        }
      } catch (err) {
        console.error('Streaming error:', err);
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'streaming_error' })}\n\n`));
          await writer.close();
        } catch { /* ignore */ }
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
