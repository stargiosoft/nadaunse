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
    const { message, conversation_id, mode = 'general', meta } = await req.json();
    const today = new Date().toISOString().slice(0, 10);
    const isGreeting = meta?.type === 'greeting';
    const isTarotCards = meta?.type === 'tarot_cards';
    const isPaidMode = mode === 'saju' || mode === 'tarot';

    // ── 3. Get or create conversation ──
    let convId = conversation_id;
    let freeUsed = 0;

    if (convId) {
      const { data: conv } = await supabase
        .from('mind_talk_conversations')
        .select('free_messages_used')
        .eq('id', convId)
        .single();
      freeUsed = conv?.free_messages_used ?? 0;
    } else {
      const { data: existing } = await supabase
        .from('mind_talk_conversations')
        .select('id, free_messages_used')
        .eq('user_id', userId)
        .eq('session_date', today)
        .eq('mode', mode)
        .maybeSingle();

      if (existing) {
        convId = existing.id;
        freeUsed = existing.free_messages_used;
      } else {
        const { data: newConv } = await supabase
          .from('mind_talk_conversations')
          .insert({ user_id: userId, session_date: today, mode })
          .select('id')
          .single();
        convId = newConv!.id;
      }
    }

    // ── 4. Limit & sprout check (paid modes only) ──
    let sproutDeducted = false;
    if (isPaidMode && !isGreeting) {
      if (freeUsed >= FREE_LIMIT) {
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

        // Record transaction
        await supabase.from('sprout_transactions').insert({
          user_id: userId,
          transaction_type: 'deduct',
          amount: SPROUT_COST,
          balance_before: balance,
          balance_after: balance - SPROUT_COST,
          description: `마음톡 ${mode === 'saju' ? '사주' : '타로'} 상담`,
        });

        sproutDeducted = true;
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

    // ── 6. Load context ──
    const { data: tags } = await supabase
      .from('user_trait_tags')
      .select('tag_name, sentiment, count')
      .eq('user_id', userId)
      .order('count', { ascending: false })
      .limit(15);

    // 상황 요약
    const { data: situationSummaries } = await supabase
      .from('user_situation_summaries')
      .select('situation_summary, source_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // 오늘 감정
    const { data: todayEmotion } = await supabase
      .from('mind_talk_emotions')
      .select('emotion_score, emotion_label, memo')
      .eq('user_id', userId)
      .eq('checked_date', today)
      .maybeSingle();

    // 최근 7일 감정
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: recentEmotions } = await supabase
      .from('mind_talk_emotions')
      .select('checked_date, emotion_label, memo')
      .eq('user_id', userId)
      .gte('checked_date', weekAgo)
      .order('checked_date', { ascending: false });

    // 대화 히스토리
    const { data: history } = await supabase
      .from('mind_talk_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    // ── 7. Build context strings ──
    const emotionMap: Record<string, string> = {
      great: '좋아요', good: '괜찮아요', neutral: '그저 그래요',
      bad: '별로예요', terrible: '힘들어요',
    };

    const tagText = tags?.length
      ? tags.map(t => `#${t.tag_name}(${t.sentiment === 'positive' ? '+' : t.sentiment === 'negative' ? '-' : ''})`).join(' ')
      : '아직 없음';

    const situationText = situationSummaries?.length
      ? situationSummaries.map(s => s.situation_summary).join('\n---\n')
      : '없음';

    const todayEmotionText = todayEmotion
      ? `${emotionMap[todayEmotion.emotion_label] ?? '?'}${todayEmotion.memo ? ` — "${todayEmotion.memo}"` : ''}`
      : '체크인하지 않음';

    const recentEmotionText = recentEmotions?.length
      ? recentEmotions.map(e => `${e.checked_date}: ${emotionMap[e.emotion_label] ?? '?'}${e.memo ? ` "${e.memo}"` : ''}`).join('\n')
      : '없음';

    // ── 8. System prompt per mode ──
    const contextBlock = `[사용자 성향 태그]
${tagText}

[사용자 심리 상황 요약]
${situationText}

[오늘 감정]
${todayEmotionText}

[최근 7일 감정 흐름]
${recentEmotionText}`;

    const safetyRules = `- 의학적 진단, 약물 추천, 치료 조언 절대 금지
- 사용자가 자해/자살을 언급하면 즉시 안내:
  "지금 많이 힘들구나. 전문 상담사와 이야기하면 도움이 될 거야. 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199로 연락해봐."
- 법적/재무 조언 금지`;

    let systemPrompt = '';

    if (mode === 'general') {
      systemPrompt = `너는 나다운세 앱의 마음 친구 '마음이'야.
사용자의 오랜 친구처럼 편안하고 따뜻한 반말 톤으로 대화해.
사용자의 성향 데이터를 자연스럽게 활용하되, 데이터를 직접 언급하지 마.

${contextBlock}

[대화 규칙]
- 답변은 1~3문장으로 짧고 자연스럽게
- 공감과 경청 중심, 사용자 스스로 인사이트를 얻도록 질문으로 유도
- 첫 인사 시 사용자의 심리 상태와 성향을 바탕으로 따뜻하게 말을 걸어줘
- "~해야 한다" 식의 단정적 조언 자제
${safetyRules}`;
    } else if (mode === 'saju') {
      systemPrompt = `너는 나다운세 앱의 사주 상담사 '마음이'야.
사용자의 사주와 운세를 기반으로 따뜻하고 친근한 반말 톤으로 상담해.
실제 사주 전문가처럼 오행, 음양, 천간지지의 개념을 활용해 이야기하되, 너무 어렵지 않게 풀어서 설명해.

${contextBlock}

[대화 규칙]
- 답변은 2~4문장으로
- 사용자의 현재 고민이나 상황에 맞는 운세 해석을 제공
- 긍정적인 방향으로 안내하되 현실적으로
- 첫 인사 시 사용자의 상황을 바탕으로 오늘의 흐름이나 기운에 대해 이야기를 시작해
- "~해야 한다" 식의 단정적 조언 자제
${safetyRules}`;
    } else if (mode === 'tarot') {
      systemPrompt = `너는 나다운세 앱의 타로 상담사 '마음이'야.
타로 카드의 의미를 기반으로 따뜻하고 신비로운 반말 톤으로 상담해.
사용자의 성향 데이터를 자연스럽게 활용해.

${contextBlock}

[대화 규칙]
- 답변은 2~4문장으로
- 사용자가 타로 카드를 뽑으면 그 카드의 의미를 해석해줘
- [타로 카드 선택] 태그로 카드 정보가 전달되면 해당 카드들의 의미를 사용자의 상황에 맞게 종합적으로 해석해줘
- 카드 해석 시 각 카드의 이름과 의미를 하나씩 설명한 후 종합 해석을 제공해
- 긍정적인 방향으로 안내하되 현실적으로
- 첫 인사 시 어떤 고민에 대해 카드를 뽑아볼지 물어봐
${safetyRules}`;
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
        generationConfig: { temperature: 0.85, maxOutputTokens: 800, topP: 0.95 },
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

    const newFreeUsed = (isPaidMode && !isGreeting) ? freeUsed + 1 : freeUsed;

    (async () => {
      try {
        // 메타데이터 전송
        const metaPayload: Record<string, unknown> = {
          conversation_id: convId,
          free_messages_used: newFreeUsed,
          mode,
        };
        if (sproutDeducted) {
          const { data: updatedUser } = await supabase
            .from('users')
            .select('sprout_balance')
            .eq('id', userId)
            .single();
          metaPayload.new_sprout_balance = updatedUser?.sprout_balance ?? 0;
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify(metaPayload)}\n\n`));

        const reader = geminiResponse.body!.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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
              if (text) {
                fullResponse += text;
                await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* ignore */ }
          }
        }

        // 남은 버퍼 처리
        if (sseBuffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(sseBuffer.slice(6).trim());
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              fullResponse += text;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          } catch { /* ignore */ }
        }

        // AI 응답 저장
        if (fullResponse) {
          await supabase.from('mind_talk_messages').insert({
            conversation_id: convId, user_id: userId, role: 'assistant', content: fullResponse,
            is_paid: sproutDeducted,
          });

          await supabase
            .from('mind_talk_conversations')
            .update({
              free_messages_used: newFreeUsed,
              message_count: (history?.length || 0) + (message ? 2 : 1),
              updated_at: new Date().toISOString(),
            })
            .eq('id', convId);
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
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
