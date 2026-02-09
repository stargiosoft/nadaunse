// Supabase Edge Function: 주간 보고서 배치 생성
// 매주 일요일 오후 12시부터 pg_cron 10분 간격 반복 호출
// 전주 태그를 쌓은 모든 사용자에게 보고서 생성 + 알림톡 발송
// ※ 이미 보고서가 있는 사용자는 자동 스킵 → 반복 호출로 전체 처리 (이어하기 패턴)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflightRequest } from '../server/cors.ts'

// 배치 설정
const BATCH_CONFIG = {
  concurrency: 3, // 동시 처리 수 (5→3, 503 방지)
  delayBetweenBatches: 2000, // 배치 간 딜레이 (ms)
  maxExecutionMs: 60_000, // 최대 실행 시간 60초 (마지막 배치 포함 ~90초 이내 종료, shutdown 방지)
}

// KST (한국 시간) 오프셋
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// 전주 일~토 날짜 범위 계산 (KST 기준)
function getLastWeekRange(): { start: Date; end: Date; startDateStr: string; endDateStr: string } {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS)
  const dayOfWeek = kstNow.getUTCDay() // 0=일요일

  // KST 기준 전주 일요일/토요일
  const sundayKST = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - dayOfWeek - 7))
  const saturdayKST = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate() - dayOfWeek - 1))

  // KST 날짜 문자열 (YYYY-MM-DD)
  const startDateStr = sundayKST.toISOString().split('T')[0]
  const endDateStr = saturdayKST.toISOString().split('T')[0]

  // DB 쿼리용 UTC 타임스탬프
  const startUTC = new Date(sundayKST.getTime() - KST_OFFSET_MS)
  const endUTC = new Date(saturdayKST.getTime() - KST_OFFSET_MS + 24 * 60 * 60 * 1000 - 1)

  return { start: startUTC, end: endUTC, startDateStr, endDateStr }
}

// Slack 알림 (배치 결과 리포트)
async function sendSlackNotification(_message: string, _isError: boolean = false) {
  return // 슬랙 알림 임시 비활성화
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
    // 선택적 파라미터 (테스트용 / 관리자 재발송용)
    let testMode = false
    let testUserIds: string[] = []
    let customWeekStartDate: string | undefined  // YYYY-MM-DD
    let customWeekEndDate: string | undefined    // YYYY-MM-DD
    let selfContinue = false  // true면 시간 제한 시 자동으로 자기 자신 재호출 (클라이언트 개입 불필요)

    try {
      const body = await req.json()
      testMode = body.testMode || false
      testUserIds = body.testUserIds || []
      customWeekStartDate = body.weekStartDate
      customWeekEndDate = body.weekEndDate
      selfContinue = body.selfContinue || false
    } catch {
      // body 없으면 정상 배치 모드
    }

    console.log('🚀 [주간 보고서 배치] 시작')
    console.log('📅 실행 시간:', new Date().toISOString())
    console.log('🧪 테스트 모드:', testMode)
    if (customWeekStartDate && customWeekEndDate) {
      console.log('📅 커스텀 주차:', customWeekStartDate, '~', customWeekEndDate)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 날짜 범위 계산 (커스텀 날짜 우선, 없으면 전주 자동 계산)
    let weekRange: { start: Date; end: Date; startDateStr: string; endDateStr: string }
    if (customWeekStartDate && customWeekEndDate) {
      const startKST = new Date(customWeekStartDate + 'T00:00:00.000Z')
      const endKST = new Date(customWeekEndDate + 'T00:00:00.000Z')
      weekRange = {
        start: new Date(startKST.getTime() - KST_OFFSET_MS),
        end: new Date(endKST.getTime() - KST_OFFSET_MS + 24 * 60 * 60 * 1000 - 1),
        startDateStr: customWeekStartDate,
        endDateStr: customWeekEndDate
      }
    } else {
      weekRange = getLastWeekRange()
    }
    console.log('📅 주차 범위:', weekRange.startDateStr, '~', weekRange.endDateStr, '(UTC:', weekRange.start.toISOString(), '~', weekRange.end.toISOString(), ')')

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
      .gte('week_start_date', weekRange.startDateStr)
      .lte('week_end_date', weekRange.endDateStr)

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

    // 4. 배치 처리 (concurrency 만큼씩 병렬 처리, 시간 제한 적용)
    const results: Array<{
      userId: string
      success: boolean
      reportId?: string
      error?: string
    }> = []

    let stoppedByTimeLimit = false

    for (let i = 0; i < filteredUserIds.length; i += BATCH_CONFIG.concurrency) {
      // 시간 체크: maxExecutionMs 초과 시 안전 종료 (다음 pg_cron 호출에서 이어서 처리)
      const elapsed = Date.now() - startTime
      if (elapsed > BATCH_CONFIG.maxExecutionMs) {
        const remainingUsers = filteredUserIds.length - i
        console.log(`⏰ 실행 시간 ${(elapsed / 1000).toFixed(1)}초 경과 - 안전 종료 (미처리 ${remainingUsers}명은 다음 호출에서 이어서 처리)`)
        stoppedByTimeLimit = true
        break
      }

      const batch = filteredUserIds.slice(i, i + BATCH_CONFIG.concurrency)
      const batchNum = Math.floor(i / BATCH_CONFIG.concurrency) + 1
      const totalBatches = Math.ceil(filteredUserIds.length / BATCH_CONFIG.concurrency)
      console.log(`📦 배치 ${batchNum}/${totalBatches} 처리 중... (${batch.length}명, 경과 ${(elapsed / 1000).toFixed(0)}초)`)

      const batchPromises = batch.map(async (userId) => {
        try {
          console.log(`  👤 사용자 ${userId} 보고서 생성 시작...`)

          // generate-weekly-report Edge Function 호출
          const invokeBody: Record<string, unknown> = {
            userId,
            sendAlimtalk: true // 알림톡 발송
          }
          if (customWeekStartDate && customWeekEndDate) {
            invokeBody.weekStartDate = customWeekStartDate
            invokeBody.weekEndDate = customWeekEndDate
          }
          const response = await supabase.functions.invoke('generate-weekly-report', {
            body: invokeBody
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
    const processedCount = results.length
    const remainingCount = filteredUserIds.length - processedCount
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)

    if (stoppedByTimeLimit) {
      console.log(`⏰ [주간 보고서 배치] 시간 제한 종료 - ${processedCount}/${filteredUserIds.length}명 처리, ${remainingCount}명 다음 호출 대기`)
    } else {
      console.log('🏁 [주간 보고서 배치] 전체 완료')
    }
    console.log(`📊 결과: 성공 ${successCount}명, 실패 ${failCount}명`)
    console.log(`⏱️ 소요 시간: ${elapsedTime}초`)

    // 6. Slack 알림
    const statusEmoji = stoppedByTimeLimit ? '⏳' : '📊'
    const statusText = stoppedByTimeLimit ? '부분 완료 (시간 제한)' : '배치 완료'
    const slackMessage = `${statusEmoji} *주간 보고서 ${statusText}*
• 대상: ${filteredUserIds.length}명 (이번 호출 처리: ${processedCount}명)
• 성공: ${successCount}명
• 실패: ${failCount}명${stoppedByTimeLimit ? `\n• 미처리: ${remainingCount}명 (다음 호출에서 이어서 처리)` : ''}
• 기존 생성됨: ${existingUserIds.size}명 (스킵)
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

    // 8. selfContinue: 시간 제한 종료 시 남은 유저로 자기 자신 재호출 (fire-and-forget)
    if (stoppedByTimeLimit && selfContinue && remainingCount > 0) {
      const processedUserIds = new Set(results.map(r => r.userId))
      const remainingIds = filteredUserIds.filter(id => !processedUserIds.has(id))

      if (remainingIds.length > 0) {
        console.log(`🔄 [selfContinue] 자동 이어하기: ${remainingIds.length}명 남음, 셀프 호출 시작`)

        const selfUrl = `${supabaseUrl}/functions/v1/generate-weekly-reports-batch`
        fetch(selfUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            testMode: true,
            testUserIds: remainingIds,
            weekStartDate: customWeekStartDate,
            weekEndDate: customWeekEndDate,
            selfContinue: true
          })
        }).catch(err => console.error('❌ [selfContinue] 셀프 호출 실패:', err))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        isPartial: stoppedByTimeLimit,
        summary: {
          targetCount: filteredUserIds.length,
          processedCount,
          successCount,
          failCount,
          remainingCount,
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
