import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    // 입력값 파싱 (인증 없이도 호출 가능)
    const { birthday, gender, lunar } = await req.json()

    if (!birthday || !gender) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 파라미터가 누락되었습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SAJU_API_KEY 가져오기 (줄바꿈 제거)
    const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
    if (!sajuApiKey) {
      console.error('❌ SAJU_API_KEY 환경변수가 설정되지 않았습니다.')
      return new Response(
        JSON.stringify({ success: false, error: '서버 설정 오류' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('🔑 SAJU_API_KEY 확인:', `시작=${sajuApiKey.substring(0, 4)}***, 길이=${sajuApiKey.length}`)

    // 성별 변환 (남/여 → male/female)
    let genderForApi = gender
    if (genderForApi === '남') genderForApi = 'male'
    else if (genderForApi === '여') genderForApi = 'female'
    console.log('👤 성별 변환:', gender, '→', genderForApi)

    // lunar 파라미터 처리
    const lunarParam = lunar === 'true' || lunar === true ? 'true' : 'false'

    const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=${lunarParam}&gender=${genderForApi}&apiKey=${sajuApiKey}`
    console.log('📞 만세력 API URL:', sajuApiUrl.replace(sajuApiKey, '***'))

    // 최대 3번 재시도
    let sajuData: Record<string, unknown> | null = null

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
          }
        })

        console.log('📡 만세력 API 응답 상태:', sajuResponse.status)

        const rawText = await sajuResponse.text()

        if (!sajuResponse.ok) {
          console.error('❌ 만세력 API HTTP 오류 응답 본문:', rawText.substring(0, 1000))
          throw new Error(`만세력 API HTTP 오류: ${sajuResponse.status}`)
        }
        console.log('📡 응답 길이:', rawText.length)

        // JSON 파싱
        sajuData = JSON.parse(rawText)

        // 유효성 검증
        if (sajuData && Object.keys(sajuData).length > 0) {
          console.log('✅ 만세력 API 호출 성공 (키 개수:', Object.keys(sajuData).length, ')')
          break
        } else {
          throw new Error('만세력 API가 빈 데이터를 반환했습니다.')
        }
      } catch (error) {
        console.error(`❌ 만세력 API 시도 ${attempt}/3 실패:`, error)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    if (!sajuData || Object.keys(sajuData).length === 0) {
      console.error('❌ 만세력 API 호출 최종 실패')
      return new Response(
        JSON.stringify({ success: false, error: '만세력 데이터를 가져올 수 없습니다' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data: sajuData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ get-manse-data 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: '처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
