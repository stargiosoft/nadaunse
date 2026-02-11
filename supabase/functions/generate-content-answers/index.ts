// Supabase Edge Function: 콘텐츠 답변 생성 (병렬 처리)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      contentId,      // 콘텐츠 ID
      orderId,        // 주문 ID
      sajuRecordId,   // 사주 정보 ID
    } = await req.json()

    if (!contentId || !orderId || !sajuRecordId) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 정보가 누락되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🚀 콘텐츠 답변 생성 시작')
    console.log('📦 contentId:', contentId)
    console.log('📦 orderId:', orderId)
    console.log('📦 sajuRecordId:', sajuRecordId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ⭐ 0. 중복 호출 방지: 이미 완료된 주문이면 즉시 리턴
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('ai_generation_completed')
      .eq('id', orderId)
      .single()

    if (orderCheck?.ai_generation_completed) {
      console.log('⏭️ 이미 AI 생성 완료된 주문입니다. 중복 호출 스킵 (orderId:', orderId, ')')
      return new Response(
        JSON.stringify({ success: true, message: '이미 생성 완료된 주문입니다.', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. 콘텐츠 정보 조회
    const { data: content, error: contentError } = await supabase
      .from('master_contents')
      .select('*')
      .eq('id', contentId)
      .single()

    if (contentError || !content) {
      throw new Error('콘텐츠를 찾을 수 없습니다.')
    }

    console.log('✅ 콘텐츠 조회 완료:', content.title)

    // 2. 질문지 조회
    const { data: questions, error: questionsError } = await supabase
      .from('master_content_questions')
      .select('*')
      .eq('content_id', contentId)
      .order('question_order', { ascending: true })

    if (questionsError || !questions || questions.length === 0) {
      throw new Error('질문지를 찾을 수 없습니다.')
    }

    console.log(`✅ 질문지 조회 완료: ${questions.length}개`)

    // 3. 주문에서 사주 정보 조회 (스냅샷 - 불변값)
    // ⭐ orders 테이블에 저장된 birth_date, birth_time, gender 사용
    // saju_records는 사용자가 수정할 수 있으므로 구매 시점의 스냅샷 사용
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('full_name, birth_date, birth_time, gender')
      .eq('id', orderId)
      .single()

    if (orderError || !orderData) {
      throw new Error('주문 정보를 찾을 수 없습니다.')
    }

    if (!orderData.birth_date || !orderData.birth_time || !orderData.gender) {
      throw new Error('주문에 사주 정보가 누락되었습니다.')
    }

    // sajuRecord 호환성을 위한 객체 생성
    const sajuRecord = {
      full_name: orderData.full_name,
      birth_date: orderData.birth_date,
      birth_time: orderData.birth_time,
      gender: orderData.gender
    }

    console.log('✅ 주문에서 사주 정보 조회 완료:', sajuRecord.full_name)
    console.log('📅 birth_date:', sajuRecord.birth_date)
    console.log('🕐 birth_time:', sajuRecord.birth_time)
    console.log('👤 gender:', sajuRecord.gender)

    // 4. 초개인화를 위한 태그 + 심리 흐름 조회 (user_id 필요)
    // ⭐ 사용자가 나다움 태그를 1개 이상 모은 경우에만 적용
    let personalizationData: {
      recentPositiveTags: string[]
      recentNegativeTags: string[]
      allPositiveTags: string[]
      allNegativeTags: string[]
      recentSituationSummaries: { week: number; summary: string }[]
    } | null = null

    try {
      // 4-1. 주문에서 user_id 조회
      const { data: orderUserData, error: orderUserError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single()

      if (orderUserError || !orderUserData?.user_id) {
        console.log('⚠️ 주문에 user_id 없음, 초개인화 스킵')
      } else {
        const userId = orderUserData.user_id
        console.log('🔍 초개인화 데이터 조회 시작 (user_id:', userId, ')')

        // 4-2. 최근 4주 기준일 계산 (오늘 기준 28일 전)
        const fourWeeksAgo = new Date()
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
        const fourWeeksAgoISO = fourWeeksAgo.toISOString()

        // 4-3. 태그 조회 (is_confirmed = true인 것만)
        const { data: allTags, error: tagsError } = await supabase
          .from('user_trait_tags')
          .select('tag_name, tag_type, created_at')
          .eq('user_id', userId)
          .eq('is_confirmed', true)
          .order('created_at', { ascending: false })

        if (tagsError) {
          console.warn('⚠️ 태그 조회 실패:', tagsError)
        } else if (allTags && allTags.length > 0) {
          console.log(`✅ 태그 조회 완료: ${allTags.length}개`)

          // 최근 4주 태그 분류
          const recentTags = allTags.filter(t => new Date(t.created_at) >= fourWeeksAgo)
          const recentPositiveTags = [...new Set(recentTags.filter(t => t.tag_type === 'positive').map(t => t.tag_name))]
          const recentNegativeTags = [...new Set(recentTags.filter(t => t.tag_type === 'negative').map(t => t.tag_name))]

          // 전체 태그 분류 (중복 제거)
          const allPositiveTags = [...new Set(allTags.filter(t => t.tag_type === 'positive').map(t => t.tag_name))]
          const allNegativeTags = [...new Set(allTags.filter(t => t.tag_type === 'negative').map(t => t.tag_name))]

          console.log(`📊 최근 4주 태그: 강점 ${recentPositiveTags.length}개, 단점 ${recentNegativeTags.length}개`)
          console.log(`📊 전체 태그: 강점 ${allPositiveTags.length}개, 단점 ${allNegativeTags.length}개`)

          // 4-4. 최근 4주 심리 흐름 조회 (weekly_reports.situation_summary)
          const { data: recentReports, error: reportsError } = await supabase
            .from('weekly_reports')
            .select('week, situation_summary, week_start_date')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('week_start_date', fourWeeksAgoISO.split('T')[0])
            .order('week_start_date', { ascending: true })
            .limit(4)

          let recentSituationSummaries: { week: number; summary: string }[] = []
          if (reportsError) {
            console.warn('⚠️ 심리 흐름 조회 실패:', reportsError)
          } else if (recentReports && recentReports.length > 0) {
            recentSituationSummaries = recentReports
              .filter(r => r.situation_summary)
              .map((r, idx) => ({ week: idx + 1, summary: r.situation_summary! }))
            console.log(`✅ 심리 흐름 조회 완료: ${recentSituationSummaries.length}주`)
          }

          // 초개인화 데이터 설정
          personalizationData = {
            recentPositiveTags,
            recentNegativeTags,
            allPositiveTags,
            allNegativeTags,
            recentSituationSummaries
          }
          console.log('✅ 초개인화 데이터 준비 완료')
        } else {
          console.log('ℹ️ 태그 없음, 초개인화 스킵')
        }
      }
    } catch (personalizationError) {
      console.warn('⚠️ 초개인화 데이터 조회 오류 (무시하고 계속):', personalizationError)
    }

    // 5. 사주 타입 질문이 있으면 Saju API 한 번만 호출하여 캐싱
    // ⭐ SAJU_API_KEY를 사용하여 서버에서 직접 호출 (IP 화이트리스트 + 키 인증)
    let cachedSajuData: Record<string, unknown> | null = null
    const hasSajuQuestions = questions.some(q => q.question_type === 'saju')

    if (hasSajuQuestions) {
      console.log('🔮 사주 API 호출 시작 (서버 직접 호출)...')

      // SAJU_API_KEY 가져오기 (줄바꿈 제거)
      const sajuApiKey = Deno.env.get('SAJU_API_KEY')?.trim()
      if (!sajuApiKey) {
        console.error('❌ SAJU_API_KEY 환경변수가 설정되지 않았습니다.')
        throw new Error('사주 API 키가 설정되지 않았습니다.')
      }
      // 디버깅: API 키 정보 (앞 4자리, 길이만 표시)
      console.log('🔑 SAJU_API_KEY 확인:', `시작=${sajuApiKey.substring(0, 4)}***, 길이=${sajuApiKey.length}`)

      // 날짜 포맷 변환
      const birthDateStr = sajuRecord.birth_date as string
      const datePart = birthDateStr.includes('T') ? birthDateStr.split('T')[0] : birthDateStr.split(' ')[0]
      const dateOnly = datePart.replace(/-/g, '')
      const timeOnly = (sajuRecord.birth_time as string).replace(/:/g, '')
      const birthday = dateOnly + timeOnly

      // 성별 변환 (남/여 → male/female)
      let genderForApi = sajuRecord.gender as string
      if (genderForApi === '남') genderForApi = 'male'
      else if (genderForApi === '여') genderForApi = 'female'
      console.log('👤 성별 변환:', sajuRecord.gender, '→', genderForApi)

      const sajuApiUrl = `https://service.stargio.co.kr:8400/StargioSaju?birthday=${birthday}&lunar=false&gender=${genderForApi}&apiKey=${sajuApiKey}`
      console.log('📞 사주 API URL:', sajuApiUrl.replace(sajuApiKey, '***'))  // 키는 로그에서 마스킹

      // 최대 3번 재시도
      for (let sajuAttempt = 1; sajuAttempt <= 3; sajuAttempt++) {
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

          console.log('📡 사주 API 응답 상태:', sajuResponse.status)

          const rawText = await sajuResponse.text()

          if (!sajuResponse.ok) {
            console.error('❌ 사주 API HTTP 오류 응답 본문:', rawText.substring(0, 1000))
            throw new Error(`사주 API HTTP 오류: ${sajuResponse.status} - ${rawText.substring(0, 200)}`)
          }
          console.log('📡 응답 길이:', rawText.length)
          console.log('📡 응답 원문 (처음 500자):', rawText.substring(0, 500))

          // JSON 파싱
          cachedSajuData = JSON.parse(rawText)

          // 유효성 검증
          if (cachedSajuData && Object.keys(cachedSajuData).length > 0) {
            console.log('✅ 사주 API 호출 성공 (키 개수:', Object.keys(cachedSajuData).length, ')')
            break
          } else {
            throw new Error('사주 API가 빈 데이터를 반환했습니다.')
          }
        } catch (sajuError) {
          console.error(`❌ 사주 API 시도 ${sajuAttempt}/3 실패:`, sajuError)
          if (sajuAttempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000 * sajuAttempt))
          }
        }
      }

      if (!cachedSajuData || Object.keys(cachedSajuData).length === 0) {
        console.error('❌ 사주 API 호출 최종 실패')
        throw new Error('사주 데이터를 가져올 수 없습니다.')
      }
    }

    // ⭐ 질문을 사주/타로 그룹으로 분리
    const sajuQuestions = questions.filter((q: any) => q.question_type === 'saju')
    const tarotQuestions = questions.filter((q: any) => q.question_type === 'tarot')
    console.log(`📋 질문 그룹: 사주 ${sajuQuestions.length}개, 타로 ${tarotQuestions.length}개`)

    // ⭐ fetchWithTimeout 함수 (200초)
    const fetchWithTimeout = async (url: string, options: any, timeoutMs = 200000) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('API 호출 타임아웃 (200초 초과)')
        }
        throw error
      }
    }

    // ⭐ 단일 질문 처리 함수 (재시도 포함, previousAnswers 수신)
    async function processQuestion(
      question: any,
      previousAnswers: Array<{ questionText: string; answerText: string }>
    ) {
      // ⭐ AI 호출 전에 기존 답변 체크 (중복 호출 시 토큰 낭비 방지)
      const { data: existingAnswer } = await supabase
        .from('order_results')
        .select('gpt_response')
        .eq('order_id', orderId)
        .eq('question_id', question.id)
        .single()

      if (existingAnswer?.gpt_response) {
        console.log(`⏭️ 질문 ${question.question_order} 기존 답변 있음, AI 호출 스킵`)
        return {
          questionId: question.id,
          success: true,
          type: question.question_type,
          attempt: 0,
          answerText: existingAnswer.gpt_response,
          skipped: true
        }
      }

      const maxRetries = 5
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔹 질문 ${question.question_order}: ${question.question_type} (시도 ${attempt}/${maxRetries}, 이전답변 ${previousAnswers.length}개)`)

          let response, data

          if (question.question_type === 'saju') {
            response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/generate-saju-answer`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: content.title,
                description: content.description,
                questionerInfo: content.questioner_info,
                questionText: question.question_text,
                questionId: question.id,
                birthDate: sajuRecord.birth_date,
                birthTime: sajuRecord.birth_time,
                gender: sajuRecord.gender,
                sajuData: cachedSajuData,
                personalizationData,
                previousAnswers
              })
            })
            data = await response.json()
            if (!data.success) throw new Error(`사주 답변 생성 실패: ${data.error}`)

            // DB 저장
            const { data: existing } = await supabase
              .from('order_results').select('id')
              .eq('order_id', orderId).eq('question_id', question.id).single()

            if (existing) {
              console.log(`⚠️ 이미 존재하는 답변 스킵 (질문 ${question.question_order})`)
            } else {
              const { error: insertError } = await supabase.from('order_results').insert({
                order_id: orderId, question_id: question.id,
                question_order: question.question_order,
                question_text: question.question_text,
                gpt_response: data.answerText,
                question_type: 'saju',
                created_at: new Date().toISOString()
              })
              if (insertError) {
                console.error(`❌ order_results 저장 실패 (질문 ${question.question_order}):`, insertError)
              } else {
                console.log(`✅ order_results 저장 완료 (질문 ${question.question_order})`)
              }
            }

            console.log(`✅ 사주 답변 생성 완료 (질문 ${question.question_order})`)
            return { questionId: question.id, success: true, type: 'saju', attempt, answerText: data.answerText }

          } else if (question.question_type === 'tarot') {
            response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/generate-tarot-answer`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: content.title,
                description: content.description,
                questionerInfo: content.questioner_info,
                questionText: question.question_text,
                questionId: question.id,
                tarotCards: question.tarot_cards || null,
                personalizationData,
                previousAnswers
              })
            })
            data = await response.json()
            if (!data.success) throw new Error(`타로 답변 생성 실패: ${data.error}`)

            // DB 저장
            const { data: existingTarot } = await supabase
              .from('order_results').select('id')
              .eq('order_id', orderId).eq('question_id', question.id).single()

            if (existingTarot) {
              console.log(`⚠️ 이미 존재하는 타로 답변 스킵 (질문 ${question.question_order})`)
            } else {
              const { error: insertError } = await supabase.from('order_results').insert({
                order_id: orderId, question_id: question.id,
                question_order: question.question_order,
                question_text: question.question_text,
                gpt_response: data.answerText,
                question_type: 'tarot',
                tarot_card_name: data.tarotCard || null,
                tarot_card_image_url: data.imageUrl || null,
                created_at: new Date().toISOString()
              })
              if (insertError) {
                console.error(`❌ order_results 저장 실패 (질문 ${question.question_order}):`, insertError)
              } else {
                console.log(`✅ order_results 저장 완료 (질문 ${question.question_order})`)
              }
            }

            console.log(`✅ 타로 답변 생성 완료 (질문 ${question.question_order})`)
            return { questionId: question.id, success: true, type: 'tarot', attempt, answerText: data.answerText }
          } else {
            throw new Error(`알 수 없는 질문 타입: ${question.question_type}`)
          }

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          console.error(`❌ 질문 ${question.question_order} 시도 ${attempt} 실패:`, lastError.message)
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000
            console.log(`⏳ ${waitTime}ms 대기 후 재시도...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
          }
        }
      }

      console.error(`❌ 질문 ${question.question_order} 최종 실패 (${maxRetries}번 시도)`)
      return { questionId: question.id, success: false, error: lastError?.message, attempts: maxRetries }
    }

    // ⭐ 그룹별 직렬 처리 함수
    async function processGroupSerially(groupQuestions: any[], groupName: string) {
      const results: any[] = []
      const accumulatedAnswers: Array<{ questionText: string; answerText: string }> = []

      console.log(`🔄 ${groupName} 그룹 직렬 처리 시작 (${groupQuestions.length}개)`)

      for (const question of groupQuestions) {
        const result = await processQuestion(question, accumulatedAnswers)
        results.push(result)

        // 성공한 답변만 컨텍스트에 누적
        if (result.success && result.answerText) {
          accumulatedAnswers.push({
            questionText: question.question_text,
            answerText: result.answerText
          })
        }
      }

      console.log(`✅ ${groupName} 그룹 완료: ${results.filter((r: any) => r.success).length}/${groupQuestions.length} 성공`)
      return results
    }

    // ⭐ 사주/타로 그룹 병렬 실행
    console.log('🔄 그룹별 답변 생성 시작 (사주↔타로 병렬, 그룹 내 직렬)...')

    const [sajuResults, tarotResults] = await Promise.all([
      sajuQuestions.length > 0 ? processGroupSerially(sajuQuestions, '사주') : Promise.resolve([]),
      tarotQuestions.length > 0 ? processGroupSerially(tarotQuestions, '타로') : Promise.resolve([])
    ])

    const results = [...sajuResults, ...tarotResults]

    console.log('🎉 모든 답변 생성 완료')
    console.log('📊 결과:', results)

    // 실패한 질문 확인
    const failedQuestions = results.filter(r => !r.success)
    const allSucceeded = failedQuestions.length === 0

    if (failedQuestions.length > 0) {
      console.warn('⚠️ 일부 질문 처리 실패:', failedQuestions)
      console.warn(`📊 실패 요약: ${failedQuestions.length}/${questions.length}개 질문 실패`)
    }

    // 5. orders 테이블 업데이트 (⭐ 모든 질문이 성공한 경우에만 완료 표시)
    if (allSucceeded) {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          ai_generation_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderUpdateError) {
        console.error('⚠️ orders 테이블 업데이트 실패:', orderUpdateError)
      } else {
        console.log('✅ orders 테이블 업데이트 완료 (ai_generation_completed = true)')
      }
    } else {
      console.warn(`⚠️ AI 생성 미완료 (${failedQuestions.length}개 실패) - ai_generation_completed 유지 (false)`)
    }

    // 7. 알림톡 발송 (실패해도 전체 프로세스 계속 진행)
    // ⭐️ 알림톡 재시도 정책:
    // - send-alimtalk Edge Function에서 총 4번 시도 (1회 + 3회 재시도)
    // - 4번 모두 실패해도 AI 답변은 정상적으로 저장되며, 사용자는 결과를 볼 수 있음
    // - 알림톡 실패 로그는 alimtalk_logs 테이블에 기록됨
    // ⭐️ 본인 사주에서 전화번호 조회 (함께보는 사주로 지인 사주 선택해도 본인에게 알림톡 발송)
    try {
      console.log('📱 알림톡 발송 시작...')

      // ⭐️ 0단계: 이미 알림톡이 발송되었는지 확인 (중복 발송 방지)
      const { data: existingAlimtalk, error: alimtalkCheckError } = await supabase
        .from('alimtalk_logs')
        .select('id, status')
        .eq('order_id', orderId)
        .eq('status', 'success')
        .limit(1)

      if (alimtalkCheckError) {
        console.warn('⚠️ 알림톡 중복 체크 실패 (계속 진행):', alimtalkCheckError)
      } else if (existingAlimtalk && existingAlimtalk.length > 0) {
        console.log('⏭️ 이미 알림톡이 발송되었습니다. 중복 발송 스킵 (order_id:', orderId, ')')
        // 알림톡 발송 스킵하고 성공으로 처리
      } else {
        // 알림톡 발송 진행
        console.log('✅ 알림톡 중복 체크 통과, 발송 진행')

      // 1단계: 주문에서 user_id 조회
      const { data: orderInfo, error: orderInfoError } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single()

      if (orderInfoError || !orderInfo || !orderInfo.user_id) {
        console.error('❌ 주문 정보 조회 실패 또는 user_id 없음:', orderInfoError)
      } else {
        // 2단계: 본인 사주에서 전화번호 조회 (notes='본인'인 사주)
        // ⭐️ is_primary는 대표 사주 (함께보는 사주일 수 있음), notes='본인'이 실제 본인 사주
        const { data: mySaju, error: mySajuError } = await supabase
          .from('saju_records')
          .select('full_name, phone_number')
          .eq('user_id', orderInfo.user_id)
          .eq('notes', '본인')
          .single()

        if (mySajuError || !mySaju) {
          console.warn('⚠️ 본인 사주 조회 실패:', mySajuError)
        } else {
          const phoneNumber = mySaju.phone_number
          const customerName = mySaju.full_name

          if (!phoneNumber) {
            console.warn('⚠️ 본인 사주에 전화번호 없음, 알림톡 발송 스킵')
          } else if (!customerName) {
            console.warn('⚠️ 본인 사주에 고객명 없음, 알림톡 발송 스킵')
          } else {
            console.log('📞 알림톡 발송 대상:', customerName, phoneNumber)

            // 알림톡 발송 Edge Function 호출
            const alimtalkUrl = `${supabaseUrl}/functions/v1/send-alimtalk`
            const alimtalkPayload = {
              orderId: orderId,
              userId: orderInfo.user_id || 'anonymous',  // ⭐️ 방어 코드: user_id가 NULL일 경우 대비
              mobile: phoneNumber,
              customerName: customerName,
              contentId: contentId
            }

            console.log('📱 [알림톡] 호출 URL:', alimtalkUrl)
            console.log('📱 [알림톡] 요청 payload:', JSON.stringify(alimtalkPayload, null, 2))

            const alimtalkResponse = await fetch(alimtalkUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(alimtalkPayload)
            })

            console.log('📱 [알림톡] 응답 상태:', alimtalkResponse.status)
            console.log('📱 [알림톡] 응답 헤더:', JSON.stringify(Object.fromEntries(alimtalkResponse.headers.entries()), null, 2))

            const alimtalkResultText = await alimtalkResponse.text()
            console.log('📱 [알림톡] 응답 원본:', alimtalkResultText)

            let alimtalkResult
            try {
              alimtalkResult = JSON.parse(alimtalkResultText)
            } catch (parseError) {
              console.error('📱 [알림톡] JSON 파싱 실패:', parseError)
              alimtalkResult = { success: false, error: `JSON 파싱 실패: ${alimtalkResultText.substring(0, 200)}` }
            }

            if (alimtalkResult.success) {
              console.log('✅ 알림톡 발송 완료:', alimtalkResult.messageId)
            } else {
              console.warn('⚠️ 알림톡 발송 실패 (무시하고 계속):', alimtalkResult.error)
              console.warn('⚠️ 사용자는 여전히 결과를 확인할 수 있습니다.')
            }
          }
        }
      }
      } // ⭐️ else 블록 (알림톡 중복 체크 통과 시) 닫기
    } catch (alimtalkError) {
      console.warn('⚠️ 알림톡 발송 오류 (무시하고 계속):', alimtalkError)
      console.warn('⚠️ 사용자는 여전히 결과를 확인할 수 있습니다.')
      // 알림톡 실패해도 전체 프로세스는 성공으로 처리
    }

    if (allSucceeded) {
      console.log('✅ 전체 프로세스 완료! 모든 질문 생성 성공')
    } else {
      console.warn(`⚠️ 전체 프로세스 완료하였으나 일부 질문 실패 (${failedQuestions.length}/${questions.length})`)
    }

    return new Response(
      JSON.stringify({
        success: allSucceeded,  // ⭐ 모든 질문이 성공한 경우에만 true
        totalQuestions: questions.length,
        successCount: results.filter(r => r.success).length,
        failedCount: failedQuestions.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
