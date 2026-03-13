// Supabase Edge Function: 바이럴 테스트 결과 조회
// 생년월일 → 일간 로컬 계산 (JDN 기반 60갑자) → 결과 매칭 — 외부 사주 API 불필요
// 궁합(compatibility): 두 일간 → 십성 관계 계산 → relation_type으로 매칭
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

    // ─── 일간 계산 (60갑자 순환 — 외부 API 불필요) ────────────
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

    // ─── 십성 계산 (궁합용) ──────────────────────────────────
    const ELEMENT: Record<string, string> = {
      '갑': '목', '을': '목', '병': '화', '정': '화', '무': '토',
      '기': '토', '경': '금', '신': '금', '임': '수', '계': '수',
    }
    const IS_YANG: Record<string, boolean> = {
      '갑': true, '을': false, '병': true, '정': false, '무': true,
      '기': false, '경': true, '신': false, '임': true, '계': false,
    }
    const GENERATES: Record<string, string> = {
      '목': '화', '화': '토', '토': '금', '금': '수', '수': '목',
    }
    const CONTROLS: Record<string, string> = {
      '목': '토', '토': '수', '수': '화', '화': '금', '금': '목',
    }

    function calcSipsung(my: string, partner: string): string {
      const myEl = ELEMENT[my], partnerEl = ELEMENT[partner]
      const sameYinYang = IS_YANG[my] === IS_YANG[partner]
      if (myEl === partnerEl) return sameYinYang ? '비견' : '겁재'
      if (GENERATES[myEl] === partnerEl) return sameYinYang ? '식신' : '상관'
      if (CONTROLS[myEl] === partnerEl) return sameYinYang ? '편재' : '정재'
      if (CONTROLS[partnerEl] === myEl) return sameYinYang ? '편관' : '정관'
      return sameYinYang ? '편인' : '정인'
    }

    // ─── 테스트 정보 조회 (template_type 확인) ───────────────
    const { data: testInfo, error: testError } = await supabase
      .from('viral_tests')
      .select('template_type')
      .eq('id', testId)
      .single()

    if (testError || !testInfo) {
      throw new Error('테스트를 찾을 수 없습니다.')
    }

    const isCompatibility = testInfo.template_type === 'compatibility'

    // 본인 일간 계산
    const myDayMaster = calcDayMaster(birthDate, birthTime || '12:00')
    console.log('✅ 일간 계산:', myDayMaster)

    // ─── 결과 매칭 ───────────────────────────────────────────
    let myResult
    let partnerDayMaster: string | null = null
    let relationType: string | null = null

    if (isCompatibility && partnerBirthDate) {
      // 궁합: 두 일간 → 십성 → relation_type으로 매칭
      partnerDayMaster = calcDayMaster(partnerBirthDate, partnerBirthTime || '12:00')
      relationType = calcSipsung(myDayMaster, partnerDayMaster)
      console.log('💑 궁합:', myDayMaster, '+', partnerDayMaster, '=', relationType)

      const { data, error } = await supabase
        .from('viral_test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('relation_type', relationType)
        .single()

      if (error || !data) throw new Error('궁합 결과를 찾을 수 없습니다.')
      myResult = data
    } else {
      // 일반: day_master로 매칭
      const { data, error } = await supabase
        .from('viral_test_results')
        .select('*')
        .eq('test_id', testId)
        .eq('day_master', myDayMaster)
        .single()

      if (error || !data) throw new Error('결과를 찾을 수 없습니다.')
      myResult = data
    }

    // ─── 플레이 기록 저장 ────────────────────────────────────
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

    // ─── 응답 ────────────────────────────────────────────────
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
          relationType: relationType || null,
        },
        partnerDayMaster,
        relationType,
        isCompatibility,
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
