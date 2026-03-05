// Supabase Edge Function: 사주 상담 답변 생성 (GPT-4.1-mini)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 [Edge Function] generate-saju-consult 시작')

    const requestBody = await req.json()
    console.log('📥 [Edge Function] 요청 body:', JSON.stringify({ question: requestBody.question?.substring(0, 50), sajuRecordId: requestBody.sajuRecordId, userId: requestBody.userId?.substring(0, 8), hasBirthInfo: !!requestBody.birthInfo }))

    const { question, sajuRecordId, userId, birthInfo } = requestBody

    // 입력 검증
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      console.error('❌ [Edge Function] question 누락 또는 빈 문자열')
      return new Response(
        JSON.stringify({ success: false, error: '질문을 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (question.length > 300) {
      console.error('❌ [Edge Function] question 길이 초과:', question.length)
      return new Response(
        JSON.stringify({ success: false, error: '질문은 300자 이내로 입력해주세요.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // guest mode: 비회원 + birthInfo 직접 전달
    const isGuestMode = !userId && !!birthInfo

    if (!isGuestMode && (!sajuRecordId || !userId)) {
      console.error('❌ [Edge Function] sajuRecordId 또는 userId 누락')
      return new Response(
        JSON.stringify({ success: false, error: '사주 정보와 로그인이 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ⭐ 비회원 상담 체험 1회 제한 (fingerprint 기반)
    if (isGuestMode) {
      console.log('🔒 [Edge Function] 비회원 사주 상담 → fingerprint 체크')

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || req.headers.get('cf-connecting-ip')
        || 'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'

      const encoder = new TextEncoder()
      const data = encoder.encode(ip + userAgent)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      console.log('📌 [Edge Function] fingerprint:', fingerprint.substring(0, 16) + '...')

      const { count, error: countError } = await supabase
        .from('anonymous_consult_views')
        .select('*', { count: 'exact', head: true })
        .eq('fingerprint', fingerprint)

      if (countError) {
        console.warn('⚠️ [Edge Function] anonymous_consult_views 조회 실패:', countError)
      } else if ((count ?? 0) >= 1) {
        console.log('🚫 [Edge Function] 비회원 상담 체험 제한 도달 → CONSULT_LIMIT_REACHED')
        return new Response(
          JSON.stringify({ success: false, error: 'CONSULT_LIMIT_REACHED' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: insertError } = await supabase
        .from('anonymous_consult_views')
        .insert({ fingerprint, consult_type: 'saju' })

      if (insertError) {
        if (insertError.code === '23505') {
          console.log('🚫 [Edge Function] fingerprint 중복 → CONSULT_LIMIT_REACHED')
          return new Response(
            JSON.stringify({ success: false, error: 'CONSULT_LIMIT_REACHED' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        console.warn('⚠️ [Edge Function] anonymous_consult_views INSERT 실패:', insertError)
      } else {
        console.log('✅ [Edge Function] 비회원 상담 체험 기록 완료')
      }
    }

    // 사주 정보 조회 (로그인 vs 게스트 분기)
    let questionerInfo = ''
    let birthDateStr = ''
    let birthTimeStr = '12:00'
    let genderStr = ''

    if (isGuestMode) {
      // 게스트 모드: birthInfo에서 직접 추출
      console.log('👤 [Edge Function] 게스트 모드 → birthInfo에서 사주 정보 추출')
      questionerInfo = `이름: ${birthInfo.name}, 성별: ${birthInfo.gender}, 생년월일: ${birthInfo.birthDate}, 출생시간: ${birthInfo.birthTime || '모름'}`
      birthDateStr = birthInfo.birthDate
      birthTimeStr = birthInfo.birthTime || '12:00'
      genderStr = birthInfo.gender
      console.log('✅ [Edge Function] 게스트 사주 정보:', questionerInfo)
    } else {
      // 로그인 모드: saju_records 조회
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔍 [Edge Function] 사주 레코드 조회')

      const { data: sajuInfo, error: sajuError } = await supabase
        .from('saju_records')
        .select('*')
        .eq('id', sajuRecordId)
        .eq('user_id', userId)
        .single()

      if (sajuError || !sajuInfo) {
        console.error('❌ [Edge Function] 사주 레코드 조회 실패:', sajuError)
        return new Response(
          JSON.stringify({ success: false, error: '사주 정보를 찾을 수 없습니다.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [Edge Function] 사주 레코드 조회 성공:', sajuInfo.full_name, sajuInfo.gender, sajuInfo.birth_date)
      questionerInfo = `이름: ${sajuInfo.full_name}, 성별: ${sajuInfo.gender}, 생년월일: ${sajuInfo.birth_date}, 출생시간: ${sajuInfo.birth_time || '모름'}`
      birthDateStr = sajuInfo.birth_date as string
      birthTimeStr = (sajuInfo.birth_time as string) || '12:00'
      genderStr = sajuInfo.gender as string
    }

    // 사주 API 호출
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔮 [Edge Function] 사주 API 호출 (상세 사주 정보 조회)')

    let detailedSajuInfo = ''

    try {
      const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()

      if (!sajuApiKey) {
        console.warn('⚠️ [Edge Function] SAJU_API_KEY 환경변수 없음, 기본 사주 정보만 사용')
      } else {

        if (!birthDateStr) {
          console.warn('⚠️ [Edge Function] 생년월일이 없음, 사주 API 호출 스킵')
          throw new Error('생년월일 정보가 없습니다.')
        }

        const datePart = birthDateStr.includes('T') ? birthDateStr.split('T')[0] : birthDateStr.split(' ')[0]
        const dateOnly = datePart.replace(/-/g, '')
        const timeOnly = birthTimeStr.replace(/:/g, '').substring(0, 4)
        const birthday = dateOnly + timeOnly

        const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=false&gender=${genderStr}&apiKey=${sajuApiKey}`
        console.log('📞 [Edge Function] 사주 API URL:', sajuApiUrl.replace(sajuApiKey, '***'))

        let cachedSajuData: Record<string, unknown> | null = null

        for (let sajuAttempt = 1; sajuAttempt <= 3; sajuAttempt++) {
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
              }
            })

            console.log(`📡 [Edge Function] 사주 API 응답 상태 (시도 ${sajuAttempt}/3):`, sajuResponse.status)

            if (!sajuResponse.ok) {
              throw new Error(`사주 API HTTP 오류: ${sajuResponse.status}`)
            }

            const rawText = await sajuResponse.text()
            console.log('📡 [Edge Function] 응답 길이:', rawText.length)

            cachedSajuData = JSON.parse(rawText)

            if (cachedSajuData && Object.keys(cachedSajuData).length > 0) {
              console.log('✅ [Edge Function] 사주 API 호출 성공 (키 개수:', Object.keys(cachedSajuData).length, ')')
              break
            } else {
              throw new Error('사주 API가 빈 데이터를 반환했습니다.')
            }
          } catch (sajuError) {
            console.error(`❌ [Edge Function] 사주 API 시도 ${sajuAttempt}/3 실패:`, sajuError)
            if (sajuAttempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * sajuAttempt))
            }
          }
        }

        if (cachedSajuData && Object.keys(cachedSajuData).length > 0) {
          const sajuDataStr = JSON.stringify(cachedSajuData, null, 2)
          detailedSajuInfo = `\n\n### 상세 사주 데이터 (명리학 분석용)\n${sajuDataStr}`
          console.log('✅ [Edge Function] 상세 사주 정보 추가 완료')
        } else {
          console.warn('⚠️ [Edge Function] 사주 API 호출 실패, 기본 정보만 사용')
        }
      }
    } catch (sajuApiError) {
      console.error('❌ [Edge Function] 사주 API 처리 오류:', sajuApiError)
      console.warn('⚠️ [Edge Function] 기본 사주 정보만 사용하여 계속 진행')
    }

    const fullQuestionerInfo = questionerInfo + detailedSajuInfo
    console.log('📌 [Edge Function] fullQuestionerInfo 길이:', fullQuestionerInfo.length)

    // OpenAI API 호출
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🤖 [Edge Function] AI 답변 생성 시작')

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('❌ [Edge Function] OpenAI API 키 없음')
      return new Response(
        JSON.stringify({ success: false, error: 'AI 서비스가 일시적으로 불가합니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `## 역할
고객의 사주 데이터와 현재 고민을 분석하여 통찰력 있는 심리 상담을 제공하는 전문 사주 명리학자.
반드시 지정된 JSON 형식으로만 응답한다.

## 질문
${question.trim()}

## 사주 정보
${fullQuestionerInfo}

## 응답 형식
반드시 아래 JSON 형식으로만 응답하라. JSON 외의 텍스트는 절대 포함하지 마라.

\`\`\`json
{
  "todayCore": {
    "keyword": "2~4글자 핵심 키워드 1개",
    "point": "6~12글자 핵심 포인트 요약 1개"
  },
  "advice": "질문에 대한 실천 가능한 조언. 3~4문장. 해요체.",
  "flow": [
    { "title": "질문과 가장 관련 깊은 영역 제목 (2~4글자)", "content": "해당 영역 흐름. 1~2문장." },
    { "title": "두 번째로 관련 깊은 영역 제목 (2~4글자)", "content": "해당 영역 흐름. 1~2문장." },
    { "title": "세 번째로 관련 깊은 영역 제목 (2~4글자)", "content": "해당 영역 흐름. 1~2문장." }
  ],
  "caution": "주의해야 할 점. 2~3문장. 해요체.",
  "overallFlow": "전체 운의 흐름 종합. 3~4문장. 해요체.",
  "recommendedCategory": {
    "main": "질문의 핵심 주제에 해당하는 대분류 1개",
    "sub": "질문의 핵심 주제에 해당하는 중분류 1개"
  }
}
\`\`\`

## 추천 카테고리 분류
질문의 핵심 주제를 분석하여 아래 카테고리 중 가장 적합한 대분류(main)와 중분류(sub)를 선택하라.

대분류 → 중분류:
- 개인운세 → 주간/월간 운세, 신년 운세, 평생 총운, 행운 아이템, 인생의 황금기, 개운법, 타고난 성격, 장점/단점 분석, 숨겨진 잠재력
- 연애 → 연애운(총론), 새로운 인연, 짝사랑, 매력 어필, 연애 스타일 분석, 결혼운/시기, 불륜
- 이별 → 재회, 이별극복
- 궁합 → 연인 궁합, 결혼 궁합, 속궁합, 친구 궁합, 동료/동업 궁합, 가족 궁합, 바람기, 신뢰도, 관계 발전, 이별 가능성
- 재물 → 재물 황금기, 횡재수/복권운, 소비/지출 습관, 빚/금전문제 해결
- 직업 → 진로/적성 탐색, 직업 재물운, 취업/이직운, 승진/성공 가능성, 사업운
- 시험/학업 → 타고난 학업운, 시험 합격 가능성
- 건강 → 주의해야 할 질병, 사고수, 다이어트/미용, 멘탈 관리
- 인간관계 → 친구/교우 관계, 가족 관계, 사회 생활/평판, 귀인/악연
- 자녀 → 자녀운/자식복, 교육/양육 조언, 자녀의 성향/적성, 자녀와의 관계
- 이사/매매 → 이사운/시기, 부동산 투자, 이동수
- 기타 → 궁금증/질문, 고민 상담

## 각 필드 작성 가이드

### todayCore (핵심)
- keyword: 질문의 본질을 꿰뚫는 단어 1개 (예: "기다림", "전환", "균형", "신중")
- point: keyword를 보완하는 짧은 문구 (예: "감정보단 판단", "마음의 준비가 먼저", "흐름을 읽는 시간")

### advice (이렇게 해보세요)
- 질문자의 고민에 직접 연결되는 구체적이고 실천 가능한 행동 조언
- 사주 데이터에 근거하되 전문용어 없이 일상 언어로 풀어 설명
- 긍정적이고 따뜻한 톤으로 질문자가 스스로 행동할 수 있도록 유도

### flow (이렇게 흘러가요)
- 질문의 주제를 분석하여 가장 관련 깊은 3개 영역을 직접 선정
- 영역 예시: 양육, 가족관계, 건강, 일/학업, 인간관계, 재물, 연애, 자녀교육, 감정관리, 자기성장, 사업, 직장, 이직, 부동산 등
- 질문 내용과 직접 연결되는 영역 위주로 선정 (예: "자녀 양육" 질문 → 양육, 가족관계, 감정관리)
- title은 2~4글자로 간결하게 (예: "양육", "가족관계", "감정관리")
- 각 항목 1~2문장으로 간결하게

### caution (이것은 조심하세요)
- 사주 데이터에서 읽히는 취약점이나 주의 사항
- 부정적이지 않게, 보완 방향을 제시하는 톤

### overallFlow (전체 운의 흐름)
- 전체 에너지 흐름을 종합하여 질문자에게 방향감 제시
- 사주의 큰 그림을 일상 언어로 풀어 따뜻하게 마무리

## 문체 및 어조
- 해요체 사용으로 따뜻하고 공감 가는 톤 유지
- 사주 전문용어 절대 금지 (오행, 대운, 상관, 편관 등)
- 쉬운 일상 언어로 풀어서 설명
- 구체적 시기 금지 ("3월", "올해 하반기" 등 특정 시점 표현 금지)
- 나이 언급 금지
- 마크다운 서식 사용 금지 (순수 텍스트만)
- ':' 및 ';' 사용하지 않고 .로 문장 마감`

    console.log('📌 [Edge Function] 프롬프트 길이:', prompt.length)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Edge Function] OpenAI API 오류:', response.status)
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorText}`)
    }

    const aiResponse = await response.json()

    let rawContent = ''
    if (aiResponse.choices && aiResponse.choices[0]?.message?.content) {
      rawContent = aiResponse.choices[0].message.content.trim()
    } else {
      throw new Error('예상하지 못한 API 응답 형식입니다.')
    }

    console.log('✅ [Edge Function] AI 응답 수신 완료, 길이:', rawContent.length)

    // JSON 파싱 (코드 블록 래핑 제거 후 파싱)
    let parsedResult: {
      todayCore: { keyword: string; point: string };
      advice: string;
      flow: Array<{ title: string; content: string }>;
      caution: string;
      overallFlow: string;
      recommendedCategory?: { main: string; sub: string };
    }

    try {
      const jsonStr = rawContent.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
      parsedResult = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('❌ [Edge Function] JSON 파싱 실패, raw:', rawContent.substring(0, 200))
      throw new Error('AI 응답 JSON 파싱에 실패했습니다.')
    }

    // 필수 필드 검증
    if (!parsedResult.todayCore || !parsedResult.advice || !parsedResult.flow || !parsedResult.caution || !parsedResult.overallFlow) {
      console.error('❌ [Edge Function] 필수 필드 누락:', Object.keys(parsedResult))
      throw new Error('AI 응답에 필수 필드가 누락되었습니다.')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ [Edge Function] 사주 상담 답변 생성 완료')
    console.log('📌 [Edge Function] keyword:', parsedResult.todayCore.keyword)
    console.log('📌 [Edge Function] point:', parsedResult.todayCore.point)

    // 응답 반환
    const responseData = {
      success: true,
      result: parsedResult
    }

    console.log('📤 [Edge Function] 응답 반환 완료')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ [Edge Function] 함수 실행 오류:', error)
    console.error('❌ [Edge Function] 에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류')
    console.error('❌ [Edge Function] 스택:', error instanceof Error ? error.stack : '')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return new Response(
      JSON.stringify({
        success: false,
        error: '상담 결과를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
