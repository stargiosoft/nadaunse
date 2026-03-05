import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PageLoader } from './ui/PageLoader';
import SEO from './SEO';
import { projectId } from '../utils/supabase/info';
import svgPaths from '../imports/svg-hpsexwso62';

// PortOne SDK 타입
declare global {
  interface Window {
    IMP?: {
      init: (merchantId: string) => void;
      request_pay: (params: Record<string, unknown>, callback: (response: Record<string, unknown>) => void) => void;
    };
  }
}

interface SproutPackage {
  id: string;
  name: string;
  base_amount: number;
  bonus_amount: number;
  total_amount: number;
  price_krw: number;
  original_price_krw: number | null;
  description: string | null;
  badge: string | null;
  sort_order: number;
}

interface RedirectPayment {
  impUid: string;
  merchantUid: string;
  packageId: string;
  payMethod: string;
  pgProvider: string;
}

interface SproutChargingStationProps {
  contentId?: string;
  currentBalance: number;
  requiredAmount?: number;
  fromProfile?: boolean;
  onBack: () => void;
  onChargeComplete: (newBalance: number) => void;
  redirectPayment?: RedirectPayment;
}

// 카카오페이 / 카드 아이콘은 인라인 SVG로 렌더링 (CSP 준수, 외부 URL 사용 금지)

export default function SproutChargingStation({
  contentId,
  currentBalance,
  requiredAmount = 30,
  fromProfile = false,
  onBack,
  onChargeComplete,
  redirectPayment,
}: SproutChargingStationProps) {
  const [packages, setPackages] = useState<SproutPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'kakaopay' | 'card'>('kakaopay');
  const [isPortOneReady, setIsPortOneReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChargeCompleted, setIsChargeCompleted] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const shortfall = Math.max(0, requiredAmount - currentBalance);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  // ⭐ 선택된 패키지 카드 gradient 테두리 회전 애니메이션
  const selectedCardGradientRef = useRef<HTMLDivElement | null>(null);
  const gradientCallbackRef = useCallback((node: HTMLDivElement | null) => {
    selectedCardGradientRef.current = node;
  }, []);

  useEffect(() => {
    let angle = 0;
    let animationId: number;
    const animate = () => {
      angle = (angle + 0.6) % 360;
      if (selectedCardGradientRef.current) {
        selectedCardGradientRef.current.style.background = `conic-gradient(from ${angle}deg, #55CAC6, #78C7FF, #FFDCF8, #78C7FF, #55CAC6)`;
      }
      animationId = requestAnimationFrame(animate);
    };
    if (selectedPackageId) {
      animationId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationId);
  }, [selectedPackageId]);

  // 패키지 로드
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const { data, error } = await supabase
          .from('sprout_packages')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('❌ [SproutChargingStation] 패키지 로드 실패:', error);
          return;
        }

        if (data && data.length > 0) {
          setPackages(data);
          const bestPkg = data.find((p: SproutPackage) => p.badge === 'BEST');
          setSelectedPackageId(bestPkg ? bestPkg.id : data[0].id);
        }
      } catch (err) {
        console.error('❌ [SproutChargingStation] 패키지 로드 예외:', err);
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadPackages();
  }, []);

  // ⭐ 모바일 PortOne 리다이렉트 결제 완료 처리
  useEffect(() => {
    if (!redirectPayment) return;

    const processRedirectPayment = async () => {
      setIsProcessing(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.');
          setIsProcessing(false);
          return;
        }

        const edgeFnUrl = `https://${projectId}.supabase.co/functions/v1/sprout-charge`;
        const res = await fetch(edgeFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            package_id: redirectPayment.packageId,
            imp_uid: redirectPayment.impUid,
            merchant_uid: redirectPayment.merchantUid,
            pay_method: redirectPayment.payMethod,
            pg_provider: redirectPayment.pgProvider,
          }),
        });

        const result = await res.json();

        if (result.success) {
          console.log('✅ [SproutChargingStation] 리다이렉트 충전 성공:', result);
          setIsChargeCompleted(true);
          onChargeComplete(result.new_balance);
        } else {
          console.error('❌ [SproutChargingStation] 리다이렉트 충전 처리 실패:', JSON.stringify(result));
          alert('충전 처리에 실패했습니다. 고객센터에 문의해주세요.');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('❌ [SproutChargingStation] 리다이렉트 충전 API 호출 실패:', err);
        alert('결제는 완료되었으나 충전 처리에 실패했습니다. 고객센터에 문의해주세요.');
        setIsProcessing(false);
      }
    };

    processRedirectPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 포트원 SDK 로드
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp38022226');
      setIsPortOneReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;
    script.onload = () => {
      if (window.IMP) {
        window.IMP.init('imp38022226');
        setIsPortOneReady(true);
      }
    };
    script.onerror = () => {
      console.error('❌ 포트원 스크립트 로드 실패');
      alert('결제 모듈을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleCharge = async () => {
    if (isProcessing || !selectedPackage) return;

    if (!isPortOneReady) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsProcessing(true);

    const pgProvider = selectedPaymentMethod === 'kakaopay'
      ? 'kakaopay.CAAHYG5DKD'
      : 'danal_tpay.A010076393';

    const merchantUid = `sprout_${Date.now()}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const paymentParams: Record<string, unknown> = {
      pg: pgProvider,
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `새싹 충전 - ${selectedPackage.name}`,
      amount: selectedPackage.price_krw,
      buyer_name: '구매자명',
      buyer_tel: '010-0000-0000',
    };

    // ⭐ 모바일: m_redirect_url 필수 (popup 모드 fallback)
    const redirectUrl = `${window.location.origin}/sprout-charging/${contentId || 'profile'}?packageId=${selectedPackage.id}&payMethod=${selectedPaymentMethod === 'kakaopay' ? 'kakaopay' : 'card'}&pgProvider=${encodeURIComponent(pgProvider)}`;
    paymentParams.m_redirect_url = redirectUrl;

    if (isMobile) {
      paymentParams.popup = true;
    } else {
      paymentParams.popup = false;
    }

    if (selectedPaymentMethod === 'card') {
      paymentParams.digital = true;
    }

    try {
      window.IMP!.request_pay(
        paymentParams,
        async function (response: Record<string, unknown>) {
          if (response.success) {
            try {
              // Edge Function은 JWT 디코딩만 사용 → getSession 캐시 토큰으로 충분
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                setIsProcessing(false);
                alert('로그인이 필요합니다. 다시 로그인해주세요.');
                return;
              }

              const edgeFnUrl = `https://${projectId}.supabase.co/functions/v1/sprout-charge`;
              const res = await fetch(edgeFnUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                  package_id: selectedPackage.id,
                  imp_uid: response.imp_uid,
                  merchant_uid: response.merchant_uid,
                  pay_method: selectedPaymentMethod === 'kakaopay' ? 'kakaopay' : 'card',
                  pg_provider: pgProvider,
                }),
              });

              const result = await res.json();

              if (result.success) {
                console.log('✅ [SproutChargingStation] 충전 성공:', result);
                setIsChargeCompleted(true);
                onChargeComplete(result.new_balance);
              } else {
                console.error('❌ [SproutChargingStation] 충전 처리 실패:', JSON.stringify(result));
                setIsProcessing(false);
                alert('충전 처리에 실패했습니다. 고객센터에 문의해주세요.');
              }
            } catch (err) {
              console.error('❌ [SproutChargingStation] 충전 API 호출 실패:', err);
              setIsProcessing(false);
              alert('결제는 완료되었으나 충전 처리에 실패했습니다. 고객센터에 문의해주세요.');
            }
          } else {
            setIsProcessing(false);
            alert('결제가 취소되었습니다.');
          }
        },
      );
    } catch (error) {
      console.error('❌ [SproutChargingStation] request_pay 에러:', error);
      setIsProcessing(false);
      alert('결제 모듈에 문제가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (isLoadingPackages) {
    return <PageLoader />;
  }

  return (
    <>
      <SEO title="새싹 충전소" noIndex={true} />
      <div className="bg-white fixed inset-0 flex justify-center">
        <style>{`
          body::-webkit-scrollbar { display: none; }
          body { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {isProcessing && (
          <div className="fixed inset-0 z-50">
            <PageLoader message="잠시만 기다려 주세요" />
          </div>
        )}

        <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
          {/* ===== Top Navigation ===== */}
          <div className="bg-white shrink-0 w-full z-20">
            <div className="flex flex-col h-[52px] items-start justify-center px-[12px] py-[4px] w-full">
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={onBack}
                  className="flex items-center justify-center p-[4px] rounded-[12px] size-[44px] bg-transparent border-none cursor-pointer transition-all duration-200 ease-out active:bg-gray-100 active:scale-90"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08"
                      stroke="#848484"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeMiterlimit="10"
                      strokeWidth="1.7"
                    />
                  </svg>
                </button>
                <p
                  className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                  style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '18px', fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#000' }}
                >
                  새싹 충전소
                </p>
                <div className="opacity-0 p-[4px] size-[44px]" />
              </div>
            </div>
          </div>

          {/* ===== Scrollable Content ===== */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col items-start w-full">
              {/* ── 부족 안내 / 남은 새싹 섹션 ── */}
              {fromProfile ? (
                /* 프로필에서 접근: 남은 새싹만 표시 */
                <div className="flex flex-col items-center justify-center px-[20px] py-[12px] w-full">
                  <div className="flex items-start px-[20px] py-[16px] rounded-[20px] w-full" style={{ backgroundColor: '#f9f9f9' }}>
                    <div className="flex flex-1 items-center justify-between">
                      <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#6d6d6d' }}>
                        남은 새싹
                      </span>
                      <div className="flex gap-[6px] items-center">
                        <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515' }}>
                          {currentBalance}
                        </span>
                        <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7.44587 3.97257C8.5912 5.39257 8.85053 7.3679 8.12387 9.1279C8.05853 9.28523 7.91787 9.39857 7.74987 9.42923C7.42987 9.48724 7.10854 9.51523 6.7912 9.51523C5.25453 9.51523 3.8032 8.85257 2.85387 7.67523C1.7092 6.25523 1.44987 4.2799 2.17587 2.51923C2.2412 2.3619 2.38187 2.24857 2.54987 2.2179C4.4212 1.87723 6.30053 2.5519 7.44587 3.97257ZM14.1239 5.85257C14.0585 5.69523 13.9179 5.5819 13.7499 5.55123C12.3219 5.29723 10.8912 5.80657 10.0159 6.89123C9.14187 7.97457 8.94387 9.48124 9.49787 10.8226C9.5632 10.9799 9.70387 11.0932 9.87187 11.1239C10.1159 11.1679 10.3599 11.1899 10.6025 11.1899C11.7739 11.1899 12.8805 10.6832 13.6052 9.78523C14.4799 8.7019 14.6779 7.19523 14.1239 5.85323V5.85257Z" fill="#97D729"/>
                          <path d="M11.7023 8.3276C11.5163 8.12494 11.2003 8.1116 10.9956 8.29827C10.0336 9.18227 9.2143 10.1829 8.53564 11.2669C8.45164 10.4116 8.2363 9.4556 7.79097 8.4616C7.00364 6.70694 5.82164 5.57427 4.9683 4.93294C4.74697 4.7656 4.43364 4.8116 4.2683 5.03227C4.1023 5.25294 4.14697 5.56627 4.36764 5.73227C5.12697 6.30227 6.1783 7.31027 6.8783 8.87027C7.65697 10.6063 7.64964 12.2176 7.50564 13.2649C7.50497 13.2709 7.51097 13.2756 7.51097 13.2809C7.48897 13.4923 7.59697 13.7023 7.8023 13.7916C7.86764 13.8196 7.93497 13.8329 8.00164 13.8329C8.1943 13.8329 8.3783 13.7203 8.4603 13.5323C8.65097 13.0923 8.8663 12.6596 9.1023 12.2476C9.77964 11.0616 10.6436 9.98094 11.673 9.03427C11.8763 8.8476 11.889 8.53094 11.7023 8.3276Z" fill="#79AD22"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 콘텐츠 구매에서 접근: 필요 새싹 / 남은 새싹 분할 표시 */
                <div className="flex flex-col gap-[10px] items-center justify-center px-[20px] py-[16px] w-full">
                  <div className="flex flex-col items-start px-[4px] w-full">
                    <div className="flex flex-col gap-[2px] items-start w-full">
                      <div style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#000' }}>
                        {shortfall > 0 ? `${shortfall}새싹이 부족해요` : '새싹을 충전해 보세요'}
                      </div>
                      <div className="flex items-center justify-center px-px w-full">
                        <p
                          className="flex-1"
                          style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484' }}
                        >
                          지금 충전하면 즉시 풀이 확인 가능해요
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 필요 새싹 / 남은 새싹 정보 박스 */}
                  <div className="flex items-start w-full">
                    <div className="flex flex-1 items-start p-[16px] rounded-[16px]" style={{ backgroundColor: '#f9f9f9' }}>
                      <div className="flex flex-1 gap-[8px] items-center">
                        {/* 필요 새싹 */}
                        <div className="flex flex-1 flex-col gap-[2px] items-start justify-center">
                          <div className="flex flex-col items-center justify-center w-full">
                            <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484', textAlign: 'center' }}>
                              필요 새싹
                            </p>
                          </div>
                          <p
                            className="w-full"
                            style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#ff6678', textAlign: 'center' }}
                          >
                            {shortfall}개
                          </p>
                        </div>
                        {/* 구분선 (세로) */}
                        <div className="h-[24px] shrink-0 w-0 relative">
                          <svg className="absolute inset-0 block" width="1" height="25" viewBox="0 0 1 25" fill="none" preserveAspectRatio="none">
                            <line x1="0.5" y1="0" x2="0.5" y2="25" stroke="#E7E7E7" />
                          </svg>
                        </div>
                        {/* 남은 새싹 */}
                        <div className="flex flex-1 flex-col gap-[2px] items-start justify-center">
                          <div className="flex flex-col items-center justify-center w-full">
                            <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484', textAlign: 'center' }}>
                              남은 새싹
                            </p>
                          </div>
                          <p
                            className="w-full"
                            style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 700, lineHeight: '28.5px', letterSpacing: '-0.32px', color: '#151515', textAlign: 'center' }}
                          >
                            {currentBalance}개
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 구분선 (부족안내 ↔ 패키지) ── */}
              <div className="bg-[#f9f9f9] h-[4px] shrink-0 w-full" />

              {/* ── 새싹 충전 패키지 섹션 ── */}
              <div className="flex flex-col gap-[12px] items-start px-[20px] py-[24px] w-full">
                <div className="flex flex-col items-start px-[4px] w-full">
                  <div className="flex flex-col gap-[2px] items-start w-full">
                    <div style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#000' }}>
                      새싹 충전
                    </div>
                    <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '19px', letterSpacing: '-0.26px', color: '#848484' }}>
                      새싹을 충전하면 더 깊은 풀이가 열려요
                    </p>
                  </div>
                </div>

                {/* 패키지 카드 리스트 */}
                <div className="flex flex-col gap-[4px] items-start w-full">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    const isBest = pkg.badge === 'BEST';

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className="flex flex-col items-start w-full cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedPackageId(pkg.id)}
                      >
                        {/* BEST 배지 (카드 위에 겹치기) */}
                        {isBest && (
                          <div className="flex flex-col items-start relative z-[2]" style={{ marginBottom: '-10px', paddingLeft: '18px' }}>
                            <div className="flex items-center justify-center rounded-[999px]" style={{ backgroundColor: '#ff6678', paddingLeft: '8px', paddingRight: '7px', paddingTop: '2px', paddingBottom: '2px' }}>
                              <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '12px', fontWeight: 600, lineHeight: '16px', letterSpacing: '-0.24px', color: '#fff' }}>
                                BEST
                              </span>
                            </div>
                          </div>
                        )}
                        {/* 패키지 카드 */}
                        <div
                          className="relative rounded-[20px] w-full z-[1]"
                          style={{
                            boxShadow: isSelected ? '0px 2px 7px 0px rgba(0,0,0,0.12)' : 'none',
                            ...(isBest ? { marginBottom: '-10px' } : {}),
                          }}
                        >
                          {/* Gradient border layer (선택 시만) */}
                          {isSelected && (
                            <div
                              ref={gradientCallbackRef}
                              className="absolute rounded-[20px]"
                              style={{
                                inset: 0,
                                background: 'conic-gradient(from 0deg, #55CAC6, #78C7FF, #FFDCF8, #78C7FF, #55CAC6)'
                              }}
                            />
                          )}
                          {/* White content layer */}
                          <div
                            className="flex flex-col items-start px-[20px] py-[18px] relative rounded-[17px]"
                            style={{
                              backgroundColor: '#fff',
                              margin: '3px',
                              boxShadow: isSelected ? 'none' : 'inset 0 0 0 1px #f3f3f3',
                            }}
                          >
                          <div className="flex flex-col items-start w-full" style={{ paddingBottom: '4px' }}>
                            {/* 상단: 이름 + 원래가격 */}
                            <div className="flex items-center justify-between w-full" style={{ marginBottom: '-4px' }}>
                              <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '15px', fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#000', whiteSpace: 'nowrap' }}>
                                {pkg.base_amount} + {pkg.bonus_amount} 보너스
                              </span>
                              {pkg.original_price_krw && (
                                <div className="flex items-center" style={{ whiteSpace: 'nowrap' }}>
                                  <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#b7b7b7', textDecoration: 'line-through' }}>
                                    {pkg.original_price_krw.toLocaleString()}
                                  </span>
                                  <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '12px', fontWeight: 400, lineHeight: '19.5px', color: '#b7b7b7', textDecoration: 'line-through' }}>
                                    원
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* 하단: 설명 + 실제가격 */}
                            <div className="flex items-center justify-between w-full" style={{ marginBottom: '-4px' }}>
                              <div className="flex items-center justify-center" style={{ paddingTop: '2px' }}>
                                <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '12px', fontWeight: 400, lineHeight: '19.5px', color: '#ff6678', whiteSpace: 'nowrap' }}>
                                  {pkg.description || ''}
                                </span>
                              </div>
                              <div className="flex gap-[2px] items-center" style={{ whiteSpace: 'nowrap' }}>
                                <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '17px', fontWeight: 700, lineHeight: '24px', letterSpacing: '-0.34px', color: '#000' }}>
                                  {pkg.price_krw.toLocaleString()}
                                </span>
                                <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '14px', fontWeight: 700, lineHeight: '22px', letterSpacing: '-0.42px', color: '#000' }}>
                                  원
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                        {/* 선택된 패키지가 BEST일 경우 아래 여백 보정 */}
                        {isBest && <div className="h-[10px]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 구분선 (패키지 ↔ 결제 수단) ── */}
              <div className="bg-[#f9f9f9] h-[4px] shrink-0 w-full" />

              {/* ── 결제 수단 섹션 (PaymentNew.tsx 동일) ── */}
              <div className="content-stretch flex flex-col gap-[16px] items-start px-[20px] py-[24px] relative shrink-0 w-full">
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '17px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.34px', color: '#000' }}>
                    결제 수단
                  </p>
                </div>

                <div className="content-stretch flex flex-col gap-[12px] h-[84px] items-start relative shrink-0 w-full">
                        {/* 카카오페이 */}
                        <button
                          onClick={() => setSelectedPaymentMethod('kakaopay')}
                          className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full bg-transparent border-none cursor-pointer p-0"
                        >
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[36px]">
                            {selectedPaymentMethod === 'kakaopay' ? (
                              <div className="relative rounded-[999px] shrink-0 size-[20px]">
                                <div aria-hidden="true" className="absolute border-[#48b2af] border-[6px] border-solid inset-0 pointer-events-none rounded-[999px]" />
                              </div>
                            ) : (
                              <div className="bg-white relative rounded-[999px] shrink-0 size-[20px]">
                                <div aria-hidden="true" className="absolute border-2 border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[999px]" />
                              </div>
                            )}
                          </div>
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                            <div className="bg-[#fbeb4f] content-stretch flex flex-col items-center justify-center relative rounded-[999px] shrink-0 size-[28px]">
                              <div className="h-[6px] relative shrink-0 w-[20px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 6">
                                  <g>
                                    <path clipRule="evenodd" d={svgPaths.p18b2da80} fill="black" fillRule="evenodd" />
                                    <path d={svgPaths.p58ec500} fill="black" />
                                    <path d={svgPaths.p22159380} fill="black" />
                                    <path d={svgPaths.pbb49340} fill="black" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                            <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#000', whiteSpace: 'nowrap' }}>
                              카카오페이
                            </p>
                          </div>
                        </button>

                        {/* 신용·체크카드 */}
                        <button
                          onClick={() => setSelectedPaymentMethod('card')}
                          className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full bg-transparent border-none cursor-pointer p-0"
                        >
                          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[36px]">
                            {selectedPaymentMethod === 'card' ? (
                              <div className="relative rounded-[999px] shrink-0 size-[20px]">
                                <div aria-hidden="true" className="absolute border-[#48b2af] border-[6px] border-solid inset-0 pointer-events-none rounded-[999px]" />
                              </div>
                            ) : (
                              <div className="bg-white relative rounded-[999px] shrink-0 size-[20px]">
                                <div aria-hidden="true" className="absolute border-2 border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[999px]" />
                              </div>
                            )}
                          </div>
                          <div className="content-stretch flex gap-[8px] items-center pl-[2px] pr-0 py-0 relative shrink-0">
                            <div className="relative shrink-0 size-[24px]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                <g>
                                  <path d={svgPaths.p1b287980} fill="#525252" />
                                  <path d={svgPaths.pba16da0} fill="#525252" />
                                  <path d={svgPaths.p1b797780} fill="#525252" />
                                  <path d={svgPaths.p3f2a0500} fill="#525252" />
                                </g>
                              </svg>
                            </div>
                            <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '15px', fontWeight: 400, lineHeight: '25.5px', letterSpacing: '-0.3px', color: '#000', whiteSpace: 'nowrap' }}>
                              신용 · 체크카드
                            </p>
                          </div>
                        </button>
                </div>
              </div>

              {/* 회색 구분선 */}
              <div className="bg-[#f9f9f9] h-[4px] shrink-0 w-full" />

              {/* ── 약관 동의 섹션 (PaymentNew.tsx 동일) ── */}
              <div className="content-stretch flex flex-col gap-[16px] items-start px-[20px] py-[24px] relative shrink-0 w-full pb-[140px]">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <p style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: '22px', letterSpacing: '-0.42px', color: '#525252', width: '100%' }}>
                    결제 금액과 안내 사항을 확인했어요
                  </p>
                </div>

                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="flex flex-col justify-center relative shrink-0 w-full" style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '0', letterSpacing: '-0.26px', color: '#525252' }}>
                      <p style={{ lineHeight: '19px' }}>
                        개인정보 수집 이용 동의
                      </p>
                    </div>
                  </div>

                  <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                      <div className="flex flex-col justify-center relative shrink-0 w-full" style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '0', letterSpacing: '-0.26px', color: '#6d6d6d' }}>
                        <p className="mb-0" style={{ lineHeight: '19px' }}>
                          수집 및 이용 목적
                        </p>
                        <ul>
                          <li className="list-disc ms-[19.5px]">
                            <span style={{ lineHeight: '19px' }}>
                              개인 맞춤형 운세 콘텐츠 생성 및 제공,
                              유료 서비스 이용에 따른 계약 이행, AI
                              콘텐츠 준비 완료 시 알림톡 발송, 고객
                              문의 응대 및 불만 처리 등 원활한
                              서비스 이용을 위한 본인 확인
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                      <div className="flex flex-col justify-center relative shrink-0 w-full" style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '0', letterSpacing: '-0.26px', color: '#6d6d6d' }}>
                        <p className="mb-0" style={{ lineHeight: '19px' }}>
                          수집하는 개인정보 항목
                        </p>
                        <ul className="list-disc">
                          <li className="mb-0 ms-[19.5px]">
                            <span style={{ lineHeight: '19px' }}>
                              회원 식별 정보: 이름, 이메일,
                              휴대전화번호
                            </span>
                          </li>
                          <li className="ms-[19.5px]">
                            <span style={{ lineHeight: '19px' }}>
                              콘텐츠 생성 정보: 생년월일, 태어난 시,
                              성별
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Bottom CTA Button ===== */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-start w-full max-w-[440px] z-10" style={{ boxShadow: '0px -8px 16px 0px rgba(255,255,255,0.76)' }}>
            <div className="flex flex-col items-center justify-center px-[20px] py-[12px] w-full bg-white">
              <motion.button
                onClick={handleCharge}
                disabled={isProcessing || !selectedPackage}
                className={`flex h-[56px] items-center justify-center px-[12px] rounded-[20px] w-full border-none transition-colors duration-200 ease-out ${
                  isProcessing || !selectedPackage
                    ? 'bg-[#48b2af]/70 cursor-not-allowed'
                    : 'bg-[#48b2af] cursor-pointer active:bg-[#41a09e]'
                }`}
                whileTap={!isProcessing && selectedPackage ? { scale: 0.99 } : {}}
                style={{ transformOrigin: 'center center', willChange: 'transform' }}
              >
                <div className="flex gap-[4px] items-center">
                  {isProcessing ? (
                    <div className="flex items-center gap-[8px]">
                      <div className="animate-spin rounded-full h-[20px] w-[20px] border-2 border-white border-t-transparent" />
                      <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: '#fff' }}>
                        처리 중...
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontFamily: "'Pretendard Variable', sans-serif", fontSize: '16px', fontWeight: 500, lineHeight: '25px', letterSpacing: '-0.32px', color: '#fff' }}>
                      {selectedPackage ? `${selectedPackage.price_krw.toLocaleString()}원 충전하기` : '패키지를 선택해주세요'}
                    </span>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
