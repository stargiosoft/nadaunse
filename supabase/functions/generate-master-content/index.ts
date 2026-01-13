// Supabase Edge Function: 마스터 콘텐츠 전체 생성 (백그라운드 실행)
// RLS 대신 Edge Function에서 JWT 인증 및 마스터 권한 검증
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
    // 1️⃣ Authorization 헤더에서 JWT 토큰 추출
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization 헤더가 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 2️⃣ Supabase Client 생성 (service_role 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3️⃣ JWT 검증 (토큰으로 사용자 확인)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ JWT 검증 실패:', authError);
      return new Response(
        JSON.stringify({ error: '유효하지 않은 토큰입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ JWT 검증 성공 - User ID:', user.id);

    // 4️⃣ 마스터 권한 확인 (users 테이블에서 role 체크)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData || userData.role !== 'master') {
      console.error('❌ 마스터 권한 없음:', user.id, 'role:', userData?.role);
      return new Response(
        JSON.stringify({ error: '마스터 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ 마스터 권한 확인 완료');

    // 5️⃣ 요청 본문 파싱
    const { contentId, title, description, questionerInfo, questions, action, questionId, questionType, questionText, imagePrompt } = await req.json()

    // 액션 타입에 따른 분기
    if (action === 'regenerate-thumbnail') {
      // 썸네일만 재생성
      console.log(`🔄 썸네일 재생성 시작: ${contentId}`)
      
      if (!contentId || !imagePrompt) {
        return new Response(
          JSON.stringify({ success: false, error: 'contentId와 imagePrompt가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        const thumbnailResponse = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ imagePrompt, contentId }),
        })

        if (!thumbnailResponse.ok) {
          throw new Error('썸네일 생성 실패')
        }

        const thumbnailData = await thumbnailResponse.json()
        console.log('✅ 썸네일 재생성 완료:', thumbnailData.imageUrl)

        // 상태를 'ready'로 업데이트
        await supabase
          .from('master_contents')
          .update({ status: 'ready' })
          .eq('id', contentId)

        return new Response(
          JSON.stringify({ success: true, thumbnailUrl: thumbnailData.imageUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('❌ 썸네일 재생성 실패:', error)
        await supabase
          .from('master_contents')
          .update({ status: 'failed' })
          .eq('id', contentId)
        
        return new Response(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (action === 'regenerate-preview') {
      // 미리보기만 재생성
      console.log(`🔄 미리보기 재생성 시작: ${questionId}`)
      
      if (!contentId || !questionId || !questionType || !questionText) {
        return new Response(
          JSON.stringify({ success: false, error: 'contentId, questionId, questionType, questionText가 필요합니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        const functionName = questionType === 'saju' ? 'generate-saju-preview' : 'generate-tarot-preview'
        
        const previewResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            questionId: questionId,
            questionText: questionText,
            title: title || '',
            description: description || '',
            questionerInfo: questionerInfo || ''
          })
        })

        if (!previewResponse.ok) {
          throw new Error('미리보기 생성 실패')
        }

        const previewData = await previewResponse.json()
        console.log('✅ 미리보기 재생성 완료:', previewData.previewText?.substring(0, 50))

        // 상태를 'ready'로 업데이트
        await supabase
          .from('master_contents')
          .update({ status: 'ready' })
          .eq('id', contentId)

        return new Response(
          JSON.stringify({ success: true, previewText: previewData.previewText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('❌ 미리보기 재생성 실패:', error)
        await supabase
          .from('master_contents')
          .update({ status: 'failed' })
          .eq('id', contentId)
        
        return new Response(
          JSON.stringify({ success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 기존 로직: 전체 생성
    if (!contentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'contentId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`\n🚀 ========== AI 생성 시작 ==========`)
    console.log(`   콘텐츠 ID: ${contentId}`)
    console.log(`   시작 시간: ${new Date().toISOString()}`)

    // 콘텐츠 정보 조회 (title, description, questioner_info, content_type, thumbnail_url, status)
    const { data: contentData, error: contentError } = await supabase
      .from('master_contents')
      .select('title, description, questioner_info, user_concern, content_type, thumbnail_url, status')
      .eq('id', contentId)
      .single()

    if (contentError || !contentData) {
      throw new Error('콘텐츠 정보를 불러올 수 없습니다.')
    }

    // 🔒 이미 완료된 콘텐츠인지 확인 (중복 생성 방지)
    if (contentData.status === 'ready' && contentData.thumbnail_url) {
      console.log('⏭️ 이미 완료된 콘텐츠입니다. 스킵합니다.')
      console.log(`   현재 상태: ${contentData.status}`)
      console.log(`   썸네일 URL: ${contentData.thumbnail_url}`)
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: '이미 생성 완료된 콘텐츠입니다.',
          thumbnailUrl: contentData.thumbnail_url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 파라미터에서 받은 값 우선, 없으면 DB에서 조회한 값 사용
    const finalTitle = title || contentData.title
    const finalDescription = description || contentData.description
    const finalQuestionerInfo = questionerInfo || contentData.questioner_info || ''

    const isFreeContent = contentData.content_type === 'free'
    console.log(`📋 콘텐츠 타입: ${isFreeContent ? '무료' : '유료'}`)
    console.log(`📝 제목: ${finalTitle}`)
    console.log(`📝 설명: ${finalDescription?.substring(0, 50)}...`)

    let thumbnailUrl = null
    let questionResults: { success: boolean; questionId?: string; error?: string }[] = []

    try {
      // 1. 이미지 프롬프트 생성 (GPT-5-nano)
      console.log('📝 Step 1: 이미지 프롬프트 생성...')
      const promptResponse = await fetch(`${supabaseUrl}/functions/v1/generate-image-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ 
          title: finalTitle, 
          description: finalDescription, 
          questionerInfo: finalQuestionerInfo 
        }),
      })

      if (!promptResponse.ok) {
        throw new Error('이미지 프롬프트 생성 실패')
      }

      const promptData = await promptResponse.json()
      const imagePrompt = promptData.imagePrompt
      console.log('✅ 이미지 프롬프트 생성 완료')

      // 2. 썸네일 생성 (Gemini 2.5)
      console.log('🖼️ Step 2: 썸네일 생성...')
      const thumbnailResponse = await fetch(`${supabaseUrl}/functions/v1/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ imagePrompt, contentId }),
      })

      if (!thumbnailResponse.ok) {
        throw new Error('썸네일 생성 실패')
      }

      const thumbnailData = await thumbnailResponse.json()
      thumbnailUrl = thumbnailData.imageUrl
      console.log('✅ 썸네일 생성 완료:', thumbnailUrl)

      // ✅ DB 업데이트는 generate-thumbnail 함수 내부에서 처리됨
      console.log('✅ 썸네일 URL DB 저장 완료 (함수 내부 처리)')

      // 3. DB에서 실제 질문 데이터 조회 (ID 확보)
      console.log('🔍 Step 3: DB에서 질문 데이터 조회...')
      const { data: dbQuestions, error: questionsError } = await supabase
        .from('master_content_questions')
        .select('*')
        .eq('content_id', contentId)
        .order('question_order', { ascending: true })

      if (questionsError || !dbQuestions) {
        throw new Error('질문 데이터 조회 실패')
      }

      console.log(`✅ ${dbQuestions.length}개 질문 조회 완료`)

      // 4. 각 질문의 미리보기 생성 (무료 콘텐츠는 스킵)
      if (isFreeContent) {
        console.log('🆓 무료 콘텐츠이므로 미리보기 생성을 건너뜁니다.')
      } else {
        // 🎯 유료 콘텐츠는 처음 3개 질문만 미리보기 생성
        const questionsToGenerate = dbQuestions.slice(0, 3)
        console.log(`📋 Step 4: 질문 미리보기 생성 중... (처음 ${questionsToGenerate.length}개 / 전체 ${dbQuestions.length}개)`)
        
        // 🚀 병렬 처리로 변경 (속도 향상)
        const previewPromises = questionsToGenerate.map(async (question, i) => {
          try {
            // ⏱️ API rate limit 회피: 각 요청 사이에 짧은 지연 추가 (0.5초씩)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500 * i));
            }
            
            console.log(`  질문 ${i + 1}/${questionsToGenerate.length} 처리 시작... (${question.question_type})`)

            let previewText = ''

            if (question.question_type === 'saju') {
              // 유료 콘텐츠는 generate-saju-preview 사용 (GPT-5.1)
              const functionName = 'generate-saju-preview'
              const sajuResponse = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  title: finalTitle,
                  description: finalDescription,
                  questionerInfo: finalQuestionerInfo,
                  questionText: question.question_text,
                }),
              })

              if (sajuResponse.ok) {
                const sajuData = await sajuResponse.json()
                previewText = sajuData.previewText
              } else {
                throw new Error('사주 미리보기 생성 실패')
              }
            } else if (question.question_type === 'tarot') {
              // 타로 미리보기 생성 (GPT-4.1)
              const tarotResponse = await fetch(`${supabaseUrl}/functions/v1/generate-tarot-preview`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  questionerInfo: finalQuestionerInfo,
                  questionText: question.question_text,
                }),
              })

              if (tarotResponse.ok) {
                const tarotData = await tarotResponse.json()
                previewText = tarotData.previewText
              } else {
                throw new Error('타로 미리보기 생성 실패')
              }
            }

            // DB 저장
            const { error: previewUpdateError } = await supabase
              .from('master_content_questions')
              .update({ preview_text: previewText })
              .eq('content_id', contentId)
              .eq('question_order', question.question_order)

            if (previewUpdateError) {
              console.error(`⚠️ 질문 ${i + 1} 미리보기 저장 실패:`, previewUpdateError)
              return { success: false, error: previewUpdateError.message }
            } else {
              console.log(`✅ 질문 ${i + 1} 미리보기 저장 완료`)
              return { success: true }
            }
          } catch (error) {
            console.error(`❌ 질문 ${i + 1} 처리 실패:`, error)
            return { 
              success: false, 
              error: error instanceof Error ? error.message : '알 수 없는 오류' 
            }
          }
        })

        // 모든 미리보기 생성 완료 대기
        questionResults = await Promise.all(previewPromises)
        console.log(`✅ 모든 미리보기 생성 완료 (성공: ${questionResults.filter(r => r.success).length}/${dbQuestions.length})`)
      }

      // 5. 모든 작업 완료 후 상태를 'ready'로 업데이트
      console.log('💾 Step 5: 상태를 ready로 업데이트 중...')
      
      // ✅ 모든 작업이 성공했는지 확인
      const allQuestionsSuccess = questionResults.length === 0 || questionResults.every(r => r.success)
      const hasThumbnail = thumbnailUrl !== null
      
      if (!hasThumbnail) {
        throw new Error('썸네일 생성 실패: 썸네일 URL이 없습니다.')
      }
      
      if (!isFreeContent && !allQuestionsSuccess) {
        throw new Error('일부 미리보기 생성 실패')
      }
      
      const { data: updateData, error: statusUpdateError } = await supabase
        .from('master_contents')
        .update({ status: 'ready' })
        .eq('id', contentId)
        .select()

      if (statusUpdateError) {
        console.error('❌ 상태 업데이트 실패:', statusUpdateError)
        throw new Error(`상태 업데이트 실패: ${statusUpdateError.message}`)
      } else {
        console.log('✅ 상태 업데이트 완료: ready', updateData)
      }

      console.log('🎉 마스터 콘텐츠 생성 완료!')

      return new Response(
        JSON.stringify({
          success: true,
          thumbnailUrl,
          questionResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('❌ 생성 중 오류:', error)

      // 실패 시 상태를 'failed'로 업데이트
      const { error: statusUpdateError } = await supabase
        .from('master_contents')
        .update({ status: 'failed' })
        .eq('id', contentId)

      if (statusUpdateError) {
        console.error('⚠️ 실패 상태 업데이트 실패:', statusUpdateError)
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
          thumbnailUrl,
          questionResults,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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