// Supabase Edge Function: 알림톡 발송 (TalkDream API)
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
  templateId: '10002' // 구매 결과 안내 템플릿
}

// 사이트 URL (환경변수로 오버라이드 가능, 스테이징에서 프로덕션 URL 발송 방지)
const SITE_URL = Deno.env.get('SITE_URL') || 'https://nadaunse.com'

// 재시도 설정 (최대 4회 시도: 1회 + 3회 재시도)
const RETRY_CONFIG = {
  maxRetries: 3, // 재시도 횟수 (1회 실패 + 3회 재시도 = 최대 4회)
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
      orderId,
      userId,
      mobile,
      customerName,
      contentId
    } = await req.json()

    if (!orderId || !userId || !mobile || !customerName || !contentId) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 정보가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 전화번호 정규화 (하이픈 제거, 숫자만 남김)
    // ⚠️ TalkDream API는 하이픈 없는 숫자만 허용 (예: 01012345678)
    const normalizedMobile = mobile.replace(/[^0-9]/g, '')

    console.log('📱 알림톡 발송 시작')
    console.log('📱 수신자 (원본):', mobile)
    console.log('📱 수신자 (정규화):', normalizedMobile)
    console.log('📱 주문 ID:', orderId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 알림톡 로그 생성
    const { data: logData, error: logError } = await supabase
      .from('alimtalk_logs')
      .insert({
        order_id: orderId,
        user_id: userId,
        phone_number: normalizedMobile, // ⭐ 정규화된 전화번호 저장
        template_code: TALKDREAM_CONFIG.templateId,
        message_content: null,
        variables: {
          customerName: customerName,
          contentId: contentId
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
    // ⚠️ 템플릿 ID: 10002 (구매 결과 안내)
    // ⚠️ 승인일: 2026/01/08 - 이모지, 띄어쓰기, 줄바꿈 모두 정확히 일치해야 함
    // ⚠️ 변수는 클라이언트에서 직접 치환해서 전송 (TalkDream API 문서 기준)
    // ⚠️ 카카오는 템플릿과 비교 후 변수 위치가 다른 글 허용
    const message = `${customerName}님, 구매하신 운세가 준비됐어요 🌱

오늘도 당신답게, 잘하고 있어요
어떤 하루든 괜찮아요
천천히 가도 충분하니까요 ✨

이번엔 어떤 가능성이 기다릴까요?
지금 바로 확인해 보세요

*본 메시지는 알림톡 수신에 동의하신 분께 발송되는 정보성 메시지입니다.

스타지오소프트
010-7442-1815`

    // 3. 알림톡 발송 (재시도 로직 포함)
    // ⭐️ 재시도 정책:
    // - 최대 4회 시도 (1회 + 3회 재시도)
    // - 재시도 간격: 5초, 15초, 30초
    // - 재시도 불가한 에러 (템플릿 불일치, 발송 불가, 수신 차단 등)는 즉시 실패 처리
    let lastError = null
    let retryCount = 0

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`📤 발송 시도 ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}`)

        // TalkDream API 호출
        // ⚠️ Header: authToken, serverName, paymentType (인증 정보)
        // ⚠️ Body: service, message, mobile, template, buttons (발송 정보)
        // ⭐ URL 직접 치환 방식 사용 (TalkDream API 문서 기준)
        // ⭐ 버튼 URL: 운세풀이 결과 페이지로 이동 (/result/saju)
        const payload = {
          service: Number(TALKDREAM_CONFIG.service), // number 타입으로 변환
          messageType: 'AT', // 알림톡
          template: TALKDREAM_CONFIG.templateId,
          mobile: normalizedMobile, // ⭐ 정규화된 전화번호 사용 (하이픈 제거)
          message: message,
          buttons: [
            {
              type: 'AC', // 채널추가 (TalkDream 설정에서 카카오톡 채널 자동 연결)
              name: '채널 추가'
            },
            {
              type: 'WL', // 웹링크
              name: '나만의 이야기 보기',
              // ⭐ 템플릿 검수된 URL (/result/saju)로 발송 후 리다이렉트
              url_mobile: `${SITE_URL}/result/saju?orderId=${orderId}&contentId=${contentId}&from=purchase`,
              url_pc: `${SITE_URL}/result/saju?orderId=${orderId}&contentId=${contentId}&from=purchase`
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
        console.log('📬 요청 payload:', JSON.stringify(payload, null, 2))

        // 성공 처리 (code 또는 status 코드 확인)
        const resultCode = result.code || result.status || result.resultCode
        const resultMessage = result.message || result.msg || result.resultMsg || '응답 메시지 없음'

        if (response.ok && (resultCode === '0000' || resultCode === 'OK' || resultCode === 'SUCCESS')) {
          console.log('✅ 알림톡 발송 성공')

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
              logId: logId
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

        // 마지막 시도가 아니면 재시도 대기
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
