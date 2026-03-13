// Supabase Edge Function: 바이럴 테스트 관리 (publish/archive)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(req)
  const corsHeaders = getCorsHeaders(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 사용자 인증
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: { user }, error: authErr } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, testId } = await req.json()

    if (!action || !testId) {
      return new Response(
        JSON.stringify({ success: false, error: 'action과 testId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 테스트 조회 + 권한 확인
    const { data: test, error: testError } = await supabase
      .from('viral_tests')
      .select('id, creator_id, status')
      .eq('id', testId)
      .single()

    if (testError || !test) {
      return new Response(
        JSON.stringify({ success: false, error: '테스트를 찾을 수 없습니다.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 마스터 역할 확인
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isMaster = userData?.role === 'master'
    const isOwner = test.creator_id === user.id

    if (!isMaster && !isOwner) {
      return new Response(
        JSON.stringify({ success: false, error: '권한이 없습니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 액션 처리
    let newStatus: string
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    switch (action) {
      case 'publish':
        if (test.status !== 'review') {
          return new Response(
            JSON.stringify({ success: false, error: 'review 상태인 테스트만 게시할 수 있습니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        newStatus = 'live'
        updateData.published_at = new Date().toISOString()
        break

      case 'archive':
        newStatus = 'archived'
        break

      case 'delete':
      case 'discard': {
        // 테스트 완전 삭제 (DB + Storage) — discard: 미게시만, delete: 모든 상태
        if (action === 'discard' && test.status === 'live') {
          return new Response(
            JSON.stringify({ success: false, error: '이미 게시된 테스트는 삭제할 수 없습니다. delete를 사용하세요.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 1. Storage 이미지 삭제 (viral-tests/{testId}/ 폴더 전체)
        const { data: files } = await supabase.storage
          .from('assets')
          .list(`viral-tests/${testId}`)

        if (files && files.length > 0) {
          const filePaths = files.map(f => `viral-tests/${testId}/${f.name}`)
          const { error: storageErr } = await supabase.storage.from('assets').remove(filePaths)
          if (storageErr) console.error('⚠️ Storage 삭제 일부 실패:', storageErr)
          else console.log(`🗑️ Storage 삭제: ${filePaths.length}개 파일`)
        }

        // 2. DB 삭제 (plays → results → test 순서, FK 제약)
        await supabase.from('viral_test_plays').delete().eq('test_id', testId)
        await supabase.from('viral_test_results').delete().eq('test_id', testId)
        await supabase.from('viral_tests').delete().eq('id', testId)

        console.log(`🗑️ 테스트 ${action} 완료: ${testId}`)

        return new Response(
          JSON.stringify({ success: true, testId, status: 'deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `알 수 없는 action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    updateData.status = newStatus

    const { error: updateError } = await supabase
      .from('viral_tests')
      .update(updateData)
      .eq('id', testId)

    if (updateError) {
      throw new Error(`상태 업데이트 실패: ${updateError.message}`)
    }

    console.log(`✅ 테스트 ${action}: ${testId} → ${newStatus}`)

    return new Response(
      JSON.stringify({ success: true, testId, status: newStatus }),
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
