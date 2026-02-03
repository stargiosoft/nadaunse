// Supabase Edge Function: 주간 보고서 배치 생성
// 매주 일요일 오후 9시 Cron Job으로 실행
// 전주 태그를 쌓은 모든 사용자에게 보고서 생성 + 알림톡 발송
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 배치 설정
const BATCH_CONFIG = {
  concurrency: 5, // 동시 처리 수 (API 과부하 방지)
  delayBetweenBatches: 2000, // 배치 간 딜레이 (ms)
}

// 전주 일~토 날짜 범위 계산
function getLastWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=일요일

  // 전주 일요일 (이번주 일요일 - 7일)
  const lastSunday = new Date(now)
  lastSunday.setDate(now.getDate() - dayOfWeek - 7)
  lastSunday.setHours(0, 0, 0, 0)

  // 전주 토요일 (전주 일요일 + 6일)
  const lastSaturday = new Date(lastSunday)
  lastSaturday.setDate(lastSunday.getDate() + 6)
  lastSaturday.setHours(23, 59, 59, 999)

  return { start: lastSunday, end: lastSaturday }
}

// Slack 알림 (배치 결과 리포트)
async function sendSlackNotification(message: string, isError: boolean = false) {
  const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
  if (!slackWebhookUrl) {
    console.warn('⚠️ SLACK_WEBHOOK_URL 미설정 - Slack 알림 스킵')
    return
  }

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        attachments: isError ? [{ color: 'danger' }] : [{ color: 'good' }]
      })
    })
  } catch (e) {
    console.error('❌ Slack 알림 실패:', e)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req)
  }

  const corsHeaders = getCorsHeaders(req)
  const startTime = Date.now()

  try {
    // 선택적 파라미터 (테스트용)
    let testMode = false
    let testUserIds: string[] = []

    try {
      const body = await req.json()
      testMode = body.testMode || false
      testUserIds = body.testUserIds || []
    } catch {
      // body 없으면 정상 배치 모드
    }

    console.log('🚀 [주간 보고서 배치] 시작')
    console.log('📅 실행 시간:', new Date().toISOString())
    console.log('🧪 테스트 모드:', testMode)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 전주 날짜 범위 계산
    const weekRange = getLastWeekRange()
    console.log('📅 전주 범위:', weekRange.start.toISOString(), '~', weekRange.end.toISOString())

    // 2. 대상 사용자 조회
    // 조건: 전주에 is_confirmed=true인 태그가 1개 이상 있는 사용자
    let targetUserIds: string[] = []

    if (testMode && testUserIds.length > 0) {
      // 테스트 모드: 지정된 사용자만
      targetUserIds = testUserIds
      console.log('🧪 테스트 대상 사용자:', targetUserIds.length, '명')
    } else {
      // 정상 모드: 전주 태그가 있는 사용자 조회
      const { data: usersWithTags, error: usersError } = await supabase
        .from('user_trait_tags')
        .select('user_id')
        .eq('is_confirmed', true)
        .neq('tag_name', '__SKIPPED__')
        .gte('created_at', weekRange.start.toISOString())
        .lte('created_at', weekRange.end.toISOString())

      if (usersError) {
        console.error('❌ 대상 사용자 조회 실패:', usersError)
        throw new Error('대상 사용자 조회에 실패했습니다.')
      }

      // 중복 제거
      const uniqueUserIds = [...new Set((usersWithTags || []).map(u => u.user_id))]
      targetUserIds = uniqueUserIds
      console.log('👥 대상 사용자:', targetUserIds.length, '명')
    }

    if (targetUserIds.length === 0) {
      console.log('ℹ️ 대상 사용자가 없습니다.')
      await sendSlackNotification('📊 *주간 보고서 배치 완료*\n대상 사용자: 0명 (전주 태그 없음)')

      return new Response(
        JSON.stringify({
          success: true,
          message: '대상 사용자가 없습니다.',
          targetCount: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. 이미 보고서가 생성된 사용자 제외
    const { data: existingReports } = await supabase
      .from('weekly_reports')
      .select('user_id')
      .gte('week_start_date', weekRange.start.toISOString().split('T')[0])
      .lte('week_end_date', weekRange.end.toISOString().split('T')[0])

    const existingUserIds = new Set((existingReports || []).map(r => r.user_id))
    const filteredUserIds = targetUserIds.filter(id => !existingUserIds.has(id))

    console.log('📋 기존 보고서 있는 사용자:', existingUserIds.size, '명 제외')
    console.log('📋 최종 대상 사용자:', filteredUserIds.length, '명')

    if (filteredUserIds.length === 0) {
      console.log('ℹ️ 모든 대상 사용자의 보고서가 이미 생성되었습니다.')
      await sendSlackNotification('📊 *주간 보고서 배치 완료*\n대상 사용자: 0명 (모두 이미 생성됨)')

      return new Response(
        JSON.stringify({
          success: true,
          message: '모든 대상 사용자의 보고서가 이미 생성되었습니다.',
          targetCount: 0,
          skippedCount: existingUserIds.size,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. 배치 처리 (concurrency 만큼씩 병렬 처리)
    const results: Array<{
      userId: string
      success: boolean
      reportId?: string
      error?: string
    }> = []

    for (let i = 0; i < filteredUserIds.length; i += BATCH_CONFIG.concurrency) {
      const batch = filteredUserIds.slice(i, i + BATCH_CONFIG.concurrency)
      console.log(`📦 배치 ${Math.floor(i / BATCH_CONFIG.concurrency) + 1}/${Math.ceil(filteredUserIds.length / BATCH_CONFIG.concurrency)} 처리 중... (${batch.length}명)`)

      const batchPromises = batch.map(async (userId) => {
        try {
          console.log(`  👤 사용자 ${userId} 보고서 생성 시작...`)

          // generate-weekly-report Edge Function 호출
          const response = await supabase.functions.invoke('generate-weekly-report', {
            body: {
              userId,
              sendAlimtalk: true // 알림톡 발송
            }
          })

          if (response.error) {
            console.error(`  ❌ 사용자 ${userId} 실패:`, response.error)
            return {
              userId,
              success: false,
              error: response.error.message || '알 수 없는 오류'
            }
          }

          const data = response.data
          if (data?.success) {
            console.log(`  ✅ 사용자 ${userId} 성공 - 보고서 ID: ${data.reportId}`)
            return {
              userId,
              success: true,
              reportId: data.reportId
            }
          } else {
            console.error(`  ❌ 사용자 ${userId} 실패:`, data?.error)
            return {
              userId,
              success: false,
              error: data?.error || '보고서 생성 실패'
            }
          }
        } catch (e) {
          console.error(`  ❌ 사용자 ${userId} 예외:`, e)
          return {
            userId,
            success: false,
            error: e instanceof Error ? e.message : '알 수 없는 오류'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // 다음 배치 전 딜레이 (마지막 배치 제외)
      if (i + BATCH_CONFIG.concurrency < filteredUserIds.length) {
        console.log(`  ⏳ ${BATCH_CONFIG.delayBetweenBatches / 1000}초 대기...`)
        await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.delayBetweenBatches))
      }
    }

    // 5. 결과 집계
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('🏁 [주간 보고서 배치] 완료')
    console.log(`📊 결과: 성공 ${successCount}명, 실패 ${failCount}명`)
    console.log(`⏱️ 소요 시간: ${elapsedTime}초`)

    // 6. Slack 알림
    const slackMessage = `📊 *주간 보고서 배치 완료*
• 대상: ${filteredUserIds.length}명
• 성공: ${successCount}명
• 실패: ${failCount}명
• 소요 시간: ${elapsedTime}초
• 기간: ${weekRange.start.toISOString().split('T')[0]} ~ ${weekRange.end.toISOString().split('T')[0]}`

    await sendSlackNotification(slackMessage, failCount > 0)

    // 7. 실패 건이 있으면 상세 로그
    if (failCount > 0) {
      const failedUsers = results.filter(r => !r.success)
      console.error('❌ 실패 사용자 목록:')
      failedUsers.forEach(f => {
        console.error(`  - ${f.userId}: ${f.error}`)
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          targetCount: filteredUserIds.length,
          successCount,
          failCount,
          skippedCount: existingUserIds.size,
          elapsedSeconds: parseFloat(elapsedTime)
        },
        weekRange: {
          start: weekRange.start.toISOString(),
          end: weekRange.end.toISOString()
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 배치 실행 오류:', error)

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    await sendSlackNotification(`🚨 *주간 보고서 배치 실패*\n\`\`\`${errorMessage}\`\`\``, true)

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
