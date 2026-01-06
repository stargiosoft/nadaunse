import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PurchaseFailure from './PurchaseFailure';

export default function PaymentComplete() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handlePaymentComplete = async () => {
      const params = new URLSearchParams(window.location.search);
      const impUid = params.get('imp_uid');
      const merchantUid = params.get('merchant_uid');
      const success = params.get('imp_success') === 'true';
      const error = params.get('error_msg');
      const contentId = params.get('contentId'); // ⭐️ URL에서 contentId 가져오기
      const userCouponId = params.get('userCouponId'); // ⭐ 쿠폰 ID 추가

      if (success && impUid && merchantUid) {
        console.log('💳 결제 성공:', { impUid, merchantUid, contentId, userCouponId });
        
        try {
          // ⭐️ Supabase 세션에서 user_id 가져오기 (보안)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user?.id) {
            console.error('❌ 세션 없음 - 로그인 필요');
            navigate('/login/new');
            return;
          }

          const userId = session.user.id;
          console.log('🔐 세션 user_id:', userId);

          // ⭐️ URL 파라미터에서 실제 결제 정보 가져오기 (1순위)
          const amountParam = params.get('amount');
          const payMethodParam = params.get('payMethod');
          
          let paidAmount = amountParam ? parseInt(amountParam) : 0;
          let payMethod = payMethodParam || 'card';
          
          console.log('💰 URL 파라미터:', { amount: amountParam, payMethod: payMethodParam });
          
          // ⭐️ URL에 금액 정보가 없으면 content_id로 조회 (2순위 - 호환성)
          if (!amountParam && contentId) {
            const { data: contentData, error: contentError } = await supabase
              .from('master_contents')
              .select('price_discount')
              .eq('id', contentId)
              .single();

            if (contentError) {
              console.error('❌ 콘텐츠 가격 조회 실패:', contentError);
            } else if (contentData) {
              paidAmount = contentData.price_discount;
              console.log('💰 DB에서 조회된 결제 금액:', paidAmount);
            }
          }
          
          console.log('✅ 최종 저장할 결제 정보:', { paidAmount, payMethod });

          // ⭐️ 주문이 아직 저장되지 않았을 수 있으므로 저장
          const { data: savedOrder, error: orderError } = await supabase.from('orders').upsert({
            user_id: userId,
            content_id: contentId,
            merchant_uid: merchantUid,
            imp_uid: impUid,
            pstatus: 'completed',
            paid_amount: paidAmount,
            pay_method: payMethod,
          }, {
            onConflict: 'merchant_uid'
          }).select().single();

          if (orderError) {
            console.error('❌ 주문 저장 실패:', orderError);
          } else {
            console.log('✅ 주문 저장 완료');
          }

          // ⭐ 쿠폰 사용 처리 (모바일 결제)
          if (userCouponId && userCouponId !== '' && savedOrder?.id) {
            console.log('🎟️ [모바일결제] 쿠폰 사용 처리 시작:', {
              userCouponId,
              orderId: savedOrder.id
            });
            
            // 쿠폰 사용 전 상태 확인
            const { data: beforeUpdate } = await supabase
              .from('user_coupons')
              .select('*, coupons(name, discount_amount)')
              .eq('id', userCouponId)
              .single();
            
            console.log('📋 [모바일결제] 쿠폰 사용 전 상태:', beforeUpdate);
            
            const { data: updatedCoupon, error: couponError } = await supabase
              .from('user_coupons')
              .update({
                is_used: true,
                used_at: new Date().toISOString(),
                used_order_id: savedOrder.id
              })
              .eq('id', userCouponId)
              .select('*, coupons(name, discount_amount)')
              .single();
            
            if (couponError) {
              console.error('❌ [모바일결제] 쿠폰 사용 처리 실패:', couponError);
            } else {
              console.log('✅ [모바일결제] 쿠폰 사용 처리 완료:', {
                userCouponId,
                couponName: updatedCoupon?.coupons?.name,
                isUsed: updatedCoupon?.is_used,
                usedAt: updatedCoupon?.used_at,
                usedOrderId: updatedCoupon?.used_order_id
              });
            }
          }

          // ⭐️ 사주 정보 존재 여부 확인 (모든 사주 레코드)
          const { data: sajuRecords, error: sajuError } = await supabase
            .from('saju_records')
            .select('id')
            .eq('user_id', userId);

          if (sajuError) {
            console.error('❌ 사주 정보 조회 실패:', sajuError);
          }

          console.log('🔮 사주 정보:', sajuRecords);

          // ⭐️ 바로 적절한 페이지로 이동
          if (sajuRecords && sajuRecords.length > 0) {
            // 사주 정보 있음 → 사주 정보 선택 페이지
            console.log('✅ 결제 완료 → 사주 정보 있음 → 사주 선택 페이지로 이동');
            navigate(`/product/${contentId}/saju-select`);
          } else {
            // 사주 정보 없음 → 사주 정보 입력 페이지
            console.log('✅ 결제 완료 → 사주 정보 없음 → 사주 입력 페이지로 이동');
            navigate(`/product/${contentId}/birthinfo`);
          }

        } catch (err) {
          console.error('❌ 결제 완료 처리 중 오류:', err);
          navigate('/');
        }
      } else {
        setStatus('fail');
        setErrorMsg(error || '결제에 실패했습니다.');
      }
    };

    handlePaymentComplete();
  }, [navigate]);

  const handleGoBack = () => {
    window.history.back();
  };

  if (status === 'fail') {
    return <PurchaseFailure onRetry={handleGoBack} onBack={handleGoBack} />;
  }

  // 로딩 중 (결제 성공 시 바로 이동하므로 이 화면만 보임)
  return (
    <div className="bg-white flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#48b2af]"></div>
      <p className="font-['Pretendard_Variable:Medium',sans-serif] text-[16px] text-black">결제 완료 처리 ...</p>
    </div>
  );
}