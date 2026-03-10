import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY')!;
const MODEL = 'gemini-2.5-flash';
const FREE_LIMIT = 3;

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

    // JWT → user
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authErr } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // ── 2. Parse request ──
    const { message, conversation_id, meta } = await req.json();
    const today = new Date().toISOString().slice(0, 10);
    const isCheckin = meta?.type === 'checkin';

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
        .maybeSingle();

      if (existing) {
        convId = existing.id;
        freeUsed = existing.free_messages_used;
      } else {
        const { data: newConv } = await supabase
          .from('mind_talk_conversations')
          .insert({ user_id: userId, session_date: today })
          .select('id')
          .single();
        convId = newConv!.id;
      }
    }

    // ── 4. Free limit check (체크인 인사는 차감 안 함) ──
    if (!isCheckin && freeUsed >= FREE_LIMIT) {
      return new Response(JSON.stringify({ error: 'FREE_LIMIT_REACHED' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 5. Save user message ──
    if (message) {
      await supabase.from('mind_talk_messages').insert({
        conversation_id: convId, user_id: userId, role: 'user', content: message,
      });
    }

    // ── 6. Load context ──
    // 나다움 태그
    const { data: tags } = await supabase
      .from('user_trait_tags')
      .select('tag_name, sentiment, count')
      .eq('user_id', userId)
      .order('count', { ascending: false })
      .limit(15);

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

    // ── 7. System prompt ──
    const emotionMap: Record<string, string> = {
      great: '😄 좋아요', good: '🙂 괜찮아요', neutral: '😐 그저 그래요',
      bad: '😔 별로예요', terrible: '😢 힘들어요',
    };

    const tagText = tags?.length
      ? tags.map(t => `#${t.tag_name}(${t.sentiment === 'positive' ? '+' : t.sentiment === 'negative' ? '-' : ''})`).join(' ')
      : '아직 없음';

    const todayEmotionText = todayEmotion
      ? `${emotionMap[todayEmotion.emotion_label] ?? '?'}${todayEmotion.memo ? ` — "${todayEmotion.memo}"` : ''}`
      : '아직 체크인하지 않음';

    const recentEmotionText = recentEmotions?.length
      ? recentEmotions.map(e => `${e.checked_date}: ${emotionMap[e.emotion_label] ?? '?'}${e.memo ? ` "${e.memo}"` : ''}`).join('\n')
      : '없음';

    const systemPrompt = `너는 나다운세 앱의 마음 친구 '마음이'야.
사용자의 오랜 친구처럼 편안하고 따뜻한 반말 톤으로 대화해.
사용자의 성향 데이터를 자연스럽게 활용하되, 데이터를 직접 언급하지 마.

[사용자 성향 태그]
${tagText}

[오늘 감정]
${todayEmotionText}

[최근 7일 감정 흐름]
${recentEmotionText}

[대화 규칙]
- 답변은 1~3문장으로 짧고 자연스럽게
- 공감과 경청 중심, 사용자 스스로 인사이트를 얻도록 질문으로 유도
- "~해야 한다" 식의 단정적 조언 자제
- 의학적 진단, 약물 추천, 치료 조언 절대 금지
- 사용자가 자해/자살을 언급하면 즉시 안내:
  "지금 많이 힘들구나. 전문 상담사와 이야기하면 도움이 될 거야. 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199로 연락해봐."
- 법적/재무 조언 금지`;

    // ── 8. Build Gemini messages ──
    const geminiMessages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history) {
      for (const h of history) {
        geminiMessages.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] });
      }
    }

    if (isCheckin) {
      geminiMessages.push({
        role: 'user',
        parts: [{ text: `[시스템: 사용자가 오늘 감정 체크인을 완료했습니다. 감정: ${meta.emotion}${meta.memo ? `, 메모: "${meta.memo}"` : ''}. 이 감정에 맞게 따뜻하게 인사하며 자연스럽게 대화를 시작해주세요. 이 메시지가 시스템 메시지임을 드러내지 마세요.]` }],
      });
    }

    // ── 9. Call Gemini streaming ──
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

    // ── 10. SSE stream to client ──
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const newFreeUsed = isCheckin ? freeUsed : freeUsed + 1;

    (async () => {
      try {
        // 메타데이터 전송
        await writer.write(encoder.encode(
          `data: ${JSON.stringify({ conversation_id: convId, free_messages_used: newFreeUsed })}\n\n`
        ));

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
