// Supabase Edge Function: 바이럴 테스트 결과 조회
// 생년월일 → 일간 로컬 계산 (JDN 기반 60갑자) → 결과 매칭 — 외부 사주 API 불필요
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

    // 일간 계산 (60갑자 순환 — 외부 API 불필요)
    const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']

    function getJDN(year: number, month: number, day: number): number {
      const a = Math.floor((14 - month) / 12)
      const y = year + 4800 - a
      const m = month + 12 * a - 3
      return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
    }

    function calcDayMaster(bDate: string, bTime: string): string {
      const datePart = bDate.includes('T') ? bDate.split('T')[0] : bDate.split(' ')[0]
      const [yearStr, monthStr, dayStr] = datePart.split('-')
      let year = parseInt(yearStr, 10)
      let month = parseInt(monthStr, 10)
      let day = parseInt(dayStr, 10)

      // 자시(23:00~) → 다음날 일간
      const hour = parseInt((bTime || '12:00').split(':')[0], 10)
      if (hour >= 23) {
        const d = new Date(year, month - 1, day + 1)
        year = d.getFullYear()
        month = d.getMonth() + 1
        day = d.getDate()
      }

      const jdn = getJDN(year, month, day)
      const index = ((jdn + 9) % 10 + 10) % 10
      return CHEONGAN[index]
    }

    // 본인 일간 계산
    const myDayMaster = calcDayMaster(birthDate, birthTime || '12:00')
    console.log('✅ 일간 계산:', myDayMaster)

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
      partnerDayMaster = calcDayMaster(partnerBirthDate, partnerBirthTime || '12:00')

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

    // play_count 원자적 증가
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
          resultLabel: myResult.result_label || null,
        },
        partnerResult: partnerResult ? {
          dayMaster: partnerDayMaster,
          element: partnerResult.element,
          resultTitle: partnerResult.result_title,
          resultDescription: partnerResult.result_description,
          resultImageUrl: partnerResult.result_image_url,
          score: partnerResult.score,
          resultLabel: partnerResult.result_label || null,
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
