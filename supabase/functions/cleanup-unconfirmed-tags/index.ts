// Supabase Edge Function: 미확인 태그 자동 정리
// 3일 이상 지난 is_confirmed=false 태그를 삭제하고 __SKIPPED__ 마커로 대체
// 실행 주기: 매일 오전 9시 KST (pg_cron으로 트리거)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

interface StaleTagGroup {
  user_id: string
  source_content_id: string | null
  source_order_id: string | null
  source_type: 'free_content' | 'paid_content'
  tag_count: number
  oldest_created_at: string
  created_at_second: string | null // 무료 콘텐츠용 (초 단위 그룹핑)
}

interface CleanupResult {
  success: boolean
  processedGroups: number
  deletedTags: number
  insertedSkipMarkers: number
  errors: string[]
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)

  try {
    // Service Role Key로 Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    console.log('🧹 [cleanup-unconfirmed-tags] 미확인 태그 정리 시작...')

    // 3일 이상 된 미확인 태그 그룹 조회
    const { data: staleGroups, error: fetchError } = await supabase
      .rpc('get_stale_unconfirmed_tag_groups')

    if (fetchError) {
      console.error('❌ [cleanup-unconfirmed-tags] 그룹 조회 실패:', fetchError)
      throw new Error(`그룹 조회 실패: ${fetchError.message}`)
    }

    if (!staleGroups || staleGroups.length === 0) {
      console.log('✅ [cleanup-unconfirmed-tags] 정리할 태그 없음')
      return new Response(
        JSON.stringify({
          success: true,
          message: '정리할 미확인 태그가 없습니다.',
          processedGroups: 0,
          deletedTags: 0,
          insertedSkipMarkers: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 [cleanup-unconfirmed-tags] 정리 대상 그룹 수: ${staleGroups.length}`)

    const result: CleanupResult = {
      success: true,
      processedGroups: 0,
      deletedTags: 0,
      insertedSkipMarkers: 0,
      errors: []
    }

    // 각 그룹별 처리
    for (const group of staleGroups as StaleTagGroup[]) {
      try {
        console.log(`🔄 [cleanup-unconfirmed-tags] 그룹 처리 중:`, {
          user_id: group.user_id,
          source_order_id: group.source_order_id,
          source_content_id: group.source_content_id,
          source_type: group.source_type,
          tag_count: group.tag_count
        })

        // 그룹 삭제 + __SKIPPED__ 마커 삽입
        const { data: processResult, error: processError } = await supabase
          .rpc('process_stale_tag_group', {
            p_user_id: group.user_id,
            p_source_content_id: group.source_content_id,
            p_source_order_id: group.source_order_id,
            p_source_type: group.source_type,
            p_created_at_second: group.created_at_second
          })

        if (processError) {
          console.error(`❌ [cleanup-unconfirmed-tags] 그룹 처리 실패:`, processError)
          result.errors.push(`그룹 처리 실패 (user_id: ${group.user_id}): ${processError.message}`)
          continue
        }

        result.processedGroups++
        result.deletedTags += group.tag_count
        result.insertedSkipMarkers++

        console.log(`✅ [cleanup-unconfirmed-tags] 그룹 처리 완료:`, {
          deleted: group.tag_count,
          skipMarkerInserted: true
        })

      } catch (groupError) {
        console.error(`❌ [cleanup-unconfirmed-tags] 그룹 처리 중 오류:`, groupError)
        result.errors.push(`그룹 처리 오류 (user_id: ${group.user_id}): ${groupError instanceof Error ? groupError.message : '알 수 없는 오류'}`)
      }
    }

    console.log('🧹 [cleanup-unconfirmed-tags] 정리 완료:', result)

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        message: `${result.processedGroups}개 그룹 처리 완료, ${result.deletedTags}개 태그 삭제, ${result.insertedSkipMarkers}개 SKIPPED 마커 생성`,
        ...result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [cleanup-unconfirmed-tags] 함수 실행 오류:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
