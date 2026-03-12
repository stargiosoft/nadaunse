// Supabase Edge Function: 바이럴 테스트 결과 조회
// 사주 입력 → 일간 추출 → 매칭 결과 반환
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const {
      testId,
      birthDate,
      birthTime,
      gender,
      calendarType = 'solar',
      // 궁합용
      partnerBirthDate,
      partnerBirthTime,
      partnerGender,
      partnerCalendarType = 'solar',
      // 추적용
      fingerprint,
      userId,
    } = await req.json()

    if (!testId || !birthDate || !gender) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 정보가 누락되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 사주 API로 일간 추출
    async function getDayMaster(
      bDate: string,
      bTime: string,
      g: string,
      lunar: boolean
    ): Promise<string> {
      const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
      if (!sajuApiKey) throw new Error('사주 API 키가 설정되지 않았습니다.')

      // 날짜 포맷
      const datePart = bDate.includes('T') ? bDate.split('T')[0] : bDate.split(' ')[0]
      const dateOnly = datePart.replace(/-/g, '')
      const timeOnly = (bTime || '12:00').replace(/:/g, '').substring(0, 4)
      const birthday = dateOnly + timeOnly

      // 성별 변환
      let genderForApi = g
      if (genderForApi === '남') genderForApi = 'male'
      else if (genderForApi === '여') genderForApi = 'female'

      const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=${lunar}&gender=${genderForApi}&apiKey=${sajuApiKey}`

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(sajuApiUrl, {
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
          })

          if (!response.ok) throw new Error(`사주 API HTTP 오류: ${response.status}`)

          const rawText = await response.text()
          const sajuData = JSON.parse(rawText)

          // 일간(天干) 추출 — 사주 API 응답에서 천간 배열의 3번째 (일주 천간)
          if (sajuData.천간 && Array.isArray(sajuData.천간) && sajuData.천간.length >= 3) {
            const dayMaster = sajuData.천간[2] // 년-월-일-시 순서에서 일간
            console.log('✅ 일간 추출:', dayMaster)
            return dayMaster
          }

          // 일주에서 추출 시도
          if (sajuData.일주 && typeof sajuData.일주 === 'string') {
            const dayMaster = sajuData.일주[0] // 일주의 첫 글자 = 일간
            console.log('✅ 일간 추출 (일주):', dayMaster)
            return dayMaster
          }

          throw new Error('사주 데이터에서 일간을 찾을 수 없습니다.')
        } catch (err) {
          console.error(`사주 API 시도 ${attempt}/3 실패:`, err)
          if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
        }
      }

      throw new Error('사주 API 호출에 실패했습니다.')
    }

    // 본인 일간 추출
    const isLunar = calendarType === 'lunar'
    const myDayMaster = await getDayMaster(birthDate, birthTime || '12:00', gender, isLunar)

    // 결과 매칭
    const { data: myResult, error: resultError } = await supabase
      .from('viral_test_results')
      .select('*')
      .eq('test_id', testId)
      .eq('day_master', myDayMaster)
      .single()

    if (resultError || !myResult) {
      throw new Error('결과를 찾을 수 없습니다.')
    }

    // 궁합 처리
    let partnerResult = null
    let partnerDayMaster: string | null = null

    if (partnerBirthDate && partnerGender) {
      const isPartnerLunar = partnerCalendarType === 'lunar'
      partnerDayMaster = await getDayMaster(
        partnerBirthDate,
        partnerBirthTime || '12:00',
        partnerGender,
        isPartnerLunar
      )

      const { data: pResult } = await supabase
        .from('viral_test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('day_master', partnerDayMaster)
        .single()

      partnerResult = pResult
    }

    // 플레이 기록 저장
    await supabase.from('viral_test_plays').insert({
      test_id: testId,
      user_id: userId || null,
      result_id: myResult.id,
      fingerprint: fingerprint || null,
      partner_day_master: partnerDayMaster,
    })

    // play_count 증가
    await supabase.rpc('increment_counter', {
      table_name: 'viral_tests',
      column_name: 'play_count',
      row_id: testId,
    }).catch(() => {
      // RPC가 없으면 직접 업데이트
      supabase.from('viral_tests')
        .update({ play_count: supabase.rpc ? undefined : 1 })
        .eq('id', testId)
    })

    // play_count 직접 증가 (위 RPC 실패 대비)
    const { data: currentTest } = await supabase
      .from('viral_tests')
      .select('play_count')
      .eq('id', testId)
      .single()

    if (currentTest) {
      await supabase.from('viral_tests')
        .update({ play_count: (currentTest.play_count || 0) + 1 })
        .eq('id', testId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        myResult: {
          dayMaster: myDayMaster,
          element: myResult.element,
          resultTitle: myResult.result_title,
          resultDescription: myResult.result_description,
          resultImageUrl: myResult.result_image_url,
          shareImageUrl: myResult.share_image_url,
          score: myResult.score,
        },
        partnerResult: partnerResult ? {
          dayMaster: partnerDayMaster,
          element: partnerResult.element,
          resultTitle: partnerResult.result_title,
          resultDescription: partnerResult.result_description,
          resultImageUrl: partnerResult.result_image_url,
          score: partnerResult.score,
        } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
