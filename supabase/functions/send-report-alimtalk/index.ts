// Supabase Edge Function: 주간 보고서 알림톡 발송 (TalkDream API)
// 템플릿 ID: 10003 - 신청한 자아 탐구 보고서 도착 안내
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// TalkDream API 설정
const TALKDREAM_CONFIG = {
  authToken: Deno.env.get('TALKDREAM_AUTH_TOKEN') || '',
  serverName: 'starsaju1',
  paymentType: 'P', // 후불충전회원 파라미터 (필수)
  service: '2500109900', // 알림톡 Service No
  baseUrl: 'https://talkapi.lgcns.com',
  templateId: '10003' // ⭐ 주간 보고서 도착 안내 템플릿
}

// 재시도 설정 (최대 4회 시도: 1회 + 3회 재시도)
const RETRY_CONFIG = {
  maxRetries: 3,
  delays: [5000, 15000, 30000] // 5초, 15초, 30초
}

// 재시도 제외 에러 코드
const NO_RETRY_ERRORS = [
  'KKO_3016', // 템플릿 불일치
  'KKO_3018', // 발송 불가
  'KKO_3020', // 수신 차단
  'ERR_AUTH'  // 인증 오류
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const {
      reportId,
      userId,
      mobile,
      customerName
    } = await req.json()

    // 필수 파라미터 검증
    if (!reportId || !userId || !mobile || !customerName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '필수 정보가 누락되었습니다',
          required: ['reportId', 'userId', 'mobile', 'customerName']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 전화번호 정규화 (하이픈 제거, 숫자만 남김)
    // ⚠️ TalkDream API는 하이픈 없는 숫자만 허용 (예: 01012345678)
    const normalizedMobile = mobile.replace(/[^0-9]/g, '')

    console.log('📱 [보고서 알림톡] 발송 시작')
    console.log('📱 보고서 ID:', reportId)
    console.log('📱 수신자 (원본):', mobile)
    console.log('📱 수신자 (정규화):', normalizedMobile)
    console.log('📱 고객명:', customerName)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 알림톡 로그 생성
    const { data: logData, error: logError } = await supabase
      .from('alimtalk_logs')
      .insert({
        order_id: null, // 보고서는 주문과 무관
        user_id: userId,
        phone_number: normalizedMobile,
        template_code: TALKDREAM_CONFIG.templateId,
        message_content: null,
        variables: {
          customerName: customerName,
          reportId: reportId
        },
        status: 'pending',
        retry_count: 0
      })
      .select()
      .single()

    if (logError) {
      console.error('❌ 로그 생성 실패:', logError)
      throw new Error('알림톡 로그 생성에 실패했습니다.')
    }

    const logId = logData.id

    // 2. 메시지 본문 구성 (검수된 템플릿과 정확히 일치해야 함)
    // ⚠️ 템플릿 ID: 10003 (주간 보고서 도착 안내)
    // ⚠️ 승인일: 2026/01/30 - 이모지, 띄어쓰기, 줄바꿈 모두 정확히 일치해야 함
    const message = `${customerName}님, 이번 주 신청하신 '나의 분석 보고서'가 도착했어요 🪞

지난 한 주, 어떤 모습이든 그건 전부 당신다운 거예요
완벽하지 않아도 괜찮아요
오늘의 나도 충분하니까요 ✨

이번 주 발견한 나, 함께 만나볼까요?

스타지오소프트
010-7442-1815`

    // 3. 알림톡 발송 (재시도 로직 포함)
    let lastError = null
    let retryCount = 0

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`📤 발송 시도 ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}`)

        // TalkDream API 호출
        const payload = {
          service: Number(TALKDREAM_CONFIG.service),
          messageType: 'AT', // 알림톡
          template: TALKDREAM_CONFIG.templateId,
          mobile: normalizedMobile,
          message: message,
          buttons: [
            {
              type: 'AC', // 채널추가
              name: '채널 추가'
            },
            {
              type: 'WL', // 웹링크
              name: '다시보기',
              url_mobile: `https://nadaunse.com/report-weekly-detail/${reportId}`,
              url_pc: `https://nadaunse.com/report-weekly-detail/${reportId}`
            }
          ]
        }

        const response = await fetch(
          `${TALKDREAM_CONFIG.baseUrl}/request/kakao.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'authToken': TALKDREAM_CONFIG.authToken,
              'serverName': TALKDREAM_CONFIG.serverName,
              'paymentType': TALKDREAM_CONFIG.paymentType
            },
            body: JSON.stringify(payload)
          }
        )

        const result = await response.json()

        console.log('📬 TalkDream 응답 상태:', response.status)
        console.log('📬 TalkDream 응답 전체:', JSON.stringify(result, null, 2))

        // 성공 처리
        const resultCode = result.code || result.status || result.resultCode
        const resultMessage = result.message || result.msg || result.resultMsg || '응답 메시지 없음'

        if (response.ok && (resultCode === '0000' || resultCode === 'OK' || resultCode === 'SUCCESS')) {
          console.log('✅ 보고서 알림톡 발송 성공')

          await supabase
            .from('alimtalk_logs')
            .update({
              status: 'success',
              message_content: message,
              sent_at: new Date().toISOString(),
              retry_count: retryCount
            })
            .eq('id', logId)

          return new Response(
            JSON.stringify({
              success: true,
              messageId: result.messageId,
              logId: logId,
              reportId: reportId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 에러 처리
        const errorCode = resultCode || 'UNKNOWN'
        const errorMessage = resultMessage

        console.error(`❌ 알림톡 발송 실패 (${errorCode}): ${errorMessage}`)

        // 재시도 제외 에러인 경우 즉시 실패 처리
        if (NO_RETRY_ERRORS.includes(errorCode)) {
          console.error('⚠️ 재시도 불가한 에러, 즉시 실패 처리')

          await supabase
            .from('alimtalk_logs')
            .update({
              status: 'failed',
              error_code: errorCode,
              error_message: errorMessage,
              retry_count: retryCount
            })
            .eq('id', logId)

          return new Response(
            JSON.stringify({
              success: false,
              error: errorMessage,
              errorCode: errorCode,
              logId: logId
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        lastError = { code: errorCode, message: errorMessage }
        retryCount++

        // 마지막 시도가 아니면 재시도 대기
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = RETRY_CONFIG.delays[attempt]
          console.log(`⏳ ${delay / 1000}초 후 재시도..`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        console.error(`❌ 발송 오류 (시도 ${attempt + 1}):`, error)
        lastError = {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '네트워크 오류'
        }
        retryCount++

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = RETRY_CONFIG.delays[attempt]
          console.log(`⏳ ${delay / 1000}초 후 재시도..`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // 모든 재시도 실패
    console.error('❌ 모든 재시도 실패')

    await supabase
      .from('alimtalk_logs')
      .update({
        status: 'failed',
        error_code: lastError?.code || 'UNKNOWN',
        error_message: lastError?.message || '알 수 없는 오류',
        retry_count: retryCount
      })
      .eq('id', logId)

    return new Response(
      JSON.stringify({
        success: false,
        error: lastError?.message || '알림톡 발송에 실패했습니다.',
        errorCode: lastError?.code || 'UNKNOWN',
        logId: logId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
