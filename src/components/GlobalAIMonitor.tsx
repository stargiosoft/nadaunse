/**
 * @file GlobalAIMonitor.tsx
 * @description 전역 AI 생성 모니터링 컴포넌트
 * 
 * @features
 * - 페이지 이동 간에도 AI 생성 상태 추적
 * - Supabase Auth State Change 리스너로 세션 유지
 * - Realtime으로 진행 상황 실시간 업데이트
 * - 하단 플로팅 패널로 로그 표시
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';

interface AIGenerationStatus {
  orderId: string;
  contentId: string;
  contentName: string;
  isGenerating: boolean;
  progress: number; // 0-100
  totalQuestions: number;
  completedQuestions: number;
}

export function GlobalAIMonitor() {
  const [status, setStatus] = useState<AIGenerationStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // ⭐ Supabase Auth State Change 리스너
  useEffect(() => {
    console.log('🔐 [AI모니터] Auth 리스너 시작');
    
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      console.log('👤 [AI모니터] 초기 사용자:', currentUserId);
      
      if (currentUserId) {
        checkOngoingGeneration(currentUserId);
      }
    });

    // Auth State Change 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);
      console.log('🔄 [AI모니터] Auth 상태 변경:', currentUserId);
      
      if (currentUserId) {
        checkOngoingGeneration(currentUserId);
      } else {
        setStatus(null);
        setLogs([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ⭐ 진행 중인 AI 생성 확인
  const checkOngoingGeneration = async (userId: string) => {
    try {
      console.log('🔍 [AI모니터] 진행 중인 주문 확인...');
      
      // 최근 10분 이내에 생성된 미완료 주문 찾기
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          content_id,
          ai_generation_completed,
          created_at,
          master_contents (
            title
          )
        `)
        .eq('user_id', userId)
        .eq('ai_generation_completed', false)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ [AI모니터] 주문 조회 실패:', error);
        // ⭐ 타임아웃 에러 처리
        if (error.message?.includes('timeout') || error.message?.includes('시간')) {
          console.warn('⚠️ [AI모니터] 네트워크 타임아웃 - 재시도 생략');
        }
        return;
      }

      if (orders && orders.length > 0) {
        const order = orders[0];
        console.log('✅ [AI모니터] 진행 중인 주문 발견:', order.id);
        
        // 진행 상황 확인
        await updateProgress(order.id, order.content_id, order.master_contents?.title || '콘텐츠');
        
        // Realtime 구독 시작
        subscribeToOrder(order.id, order.content_id, order.master_contents?.title || '콘텐츠');
      } else {
        console.log('ℹ️ [AI모니터] 진행 중인 주문 없음');
        setStatus(null);
      }
    } catch (error) {
      console.error('❌ [AI모니터] 체크 실패:', error);
      // ⭐ 에러 발생 시에도 앱이 계속 작동하도록 함
    }
  };

  // ⭐ 진행 상황 업데이트
  const updateProgress = async (orderId: string, contentId: string, contentName: string) => {
    try {
      // 질문별 답변 생성 상태 확인
      const { data: questions, error: questionsError } = await supabase
        .from('master_content_questions')
        .select('id')
        .eq('content_id', contentId)
        .order('question_order');

      if (questionsError) {
        console.error('❌ [AI모니터] 질문 조회 실패:', questionsError);
        return;
      }

      const totalQuestions = questions?.length || 0;

      const { data: answers, error: answersError } = await supabase
        .from('order_results')
        .select('id, orders!inner(user_id)')
        .eq('order_id', orderId);

      if (answersError) {
        console.error('❌ [AI모니터] 답변 조회 실패:', answersError);
        return;
      }

      const completedQuestions = answers?.length || 0;
      const progress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

      console.log(`📊 [AI모니터] 진행률: ${completedQuestions}/${totalQuestions} (${progress}%)`);

      setStatus({
        orderId,
        contentId,
        contentName,
        isGenerating: true,
        progress,
        totalQuestions,
        completedQuestions,
      });

      addLog(`🔍 AI 생성 진행 중: ${completedQuestions}/${totalQuestions} (${progress}%)`);
    } catch (error) {
      console.error('❌ [AI모니터] 진행 상황 업데이트 실패:', error);
    }
  };

  // ⭐ Realtime 구독
  const subscribeToOrder = (orderId: string, contentId: string, contentName: string) => {
    console.log('📡 [AI모니터] Realtime 구독 시작:', orderId);

    // orders 테이블 구독 (ai_generation_completed 변경 감지)
    const ordersChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('📦 [AI모니터] 주문 상태 변경:', payload.new);
          
          if (payload.new.ai_generation_completed) {
            console.log('✅ [AI모니터] AI 생성 완료!');
            addLog('✅ AI 생성 완료!');
            
            setStatus(prev => prev ? {
              ...prev,
              isGenerating: false,
              progress: 100,
            } : null);

            // 3초 후 패널 자동 닫기
            setTimeout(() => {
              setStatus(null);
              setLogs([]);
            }, 3000);
          }
        }
      )
      .subscribe();

    // order_results 테이블 구독 (답변 추가 감지)
    const resultsChannel = supabase
      .channel(`order-results-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_results',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log('📝 [AI모니터] 새 답변 생성:', payload.new);
          addLog(`📝 질문 ${payload.new.question_order} 답변 생성 완료`);
          
          // 진행 상황 업데이트
          updateProgress(orderId, contentId, contentName);
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      ordersChannel.unsubscribe();
      resultsChannel.unsubscribe();
    };
  };

  // ⭐ 로그 추가
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 진행 중인 생성이 없으면 렌더링하지 않음
  if (!status) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gradient-to-r from-purple-50 to-blue-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {status.isGenerating ? (
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          <div>
            <div className="font-medium text-gray-900">
              {status.isGenerating ? 'AI 답변 생성 중...' : 'AI 답변 생성 완료!'}
            </div>
            <div className="text-sm text-gray-600">
              {status.contentName} • {status.completedQuestions}/{status.totalQuestions} 완료
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 진행률 표시 */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {status.progress}%
            </span>
          </div>

          {/* 토글 아이콘 */}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>

      {/* 로그 패널 */}
      {isExpanded && (
        <div className="px-4 py-3 max-h-48 overflow-y-auto bg-gray-50">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}