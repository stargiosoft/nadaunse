// Supabase Edge Function: 실패한 주간 보고서 조회
// 특정 주에 태그가 있지만 보고서가 생성되지 않은 사용자 수 조회
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    const { weekStartDate, weekEndDate } = await req.json()

    if (!weekStartDate || !weekEndDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'weekStartDate, weekEndDate가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📊 [실패 보고서 조회] 시작')
    console.log('📅 기간:', weekStartDate, '~', weekEndDate)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // KST→UTC 변환 (created_at은 UTC 타임스탬프이므로 KST 날짜를 UTC로 변환해야 정확)
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000
    const startKST = new Date(weekStartDate + 'T00:00:00.000Z')
    const endKST = new Date(weekEndDate + 'T00:00:00.000Z')
    const startUTC = new Date(startKST.getTime() - KST_OFFSET_MS).toISOString()
    const endUTC = new Date(endKST.getTime() - KST_OFFSET_MS + 24 * 60 * 60 * 1000 - 1).toISOString()
    console.log('📅 UTC 범위:', startUTC, '~', endUTC)

    // 1. 해당 주에 확정 태그가 있는 사용자 목록
    const { data: usersWithTags, error: tagsError } = await supabase
      .from('user_trait_tags')
      .select('user_id')
      .eq('is_confirmed', true)
      .neq('tag_name', '__SKIPPED__')
      .gte('created_at', startUTC)
      .lte('created_at', endUTC)

    if (tagsError) {
      console.error('❌ 태그 조회 실패:', tagsError)
      throw new Error('태그 조회에 실패했습니다.')
    }

    // 중복 제거
    const uniqueUserIds = [...new Set((usersWithTags || []).map(u => u.user_id))]
    console.log('👥 태그 있는 사용자:', uniqueUserIds.length, '명')

    if (uniqueUserIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          totalUsersWithTags: 0,
          usersWithReports: 0,
          failedCount: 0,
          failedUserIds: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 해당 주에 보고서가 생성된 사용자 목록
    const { data: usersWithReports, error: reportsError } = await supabase
      .from('weekly_reports')
      .select('user_id')
      .gte('week_start_date', weekStartDate)
      .lte('week_end_date', weekEndDate)

    if (reportsError) {
      console.error('❌ 보고서 조회 실패:', reportsError)
      throw new Error('보고서 조회에 실패했습니다.')
    }

    const usersWithReportsSet = new Set((usersWithReports || []).map(r => r.user_id))
    console.log('📋 보고서 있는 사용자:', usersWithReportsSet.size, '명')

    // 3. 실패한 사용자 (태그는 있는데 보고서 없는 사용자)
    const failedUserIds = uniqueUserIds.filter(id => !usersWithReportsSet.has(id))
    console.log('⚠️ 실패한 사용자:', failedUserIds.length, '명')

    return new Response(
      JSON.stringify({
        success: true,
        totalUsersWithTags: uniqueUserIds.length,
        usersWithReports: usersWithReportsSet.size,
        failedCount: failedUserIds.length,
        failedUserIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
