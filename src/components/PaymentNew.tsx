import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import svgPaths from "../imports/svg-hpsexwso62";
import { saveOrder } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import CouponBottomSheetNew from "./CouponBottomSheetNew";
import Footer from "./Footer";
import { SessionExpiredDialog } from "./SessionExpiredDialog";
import PaymentSkeleton from "./skeletons/PaymentSkeleton";
import { DEV } from "../lib/env";
import { preloadLoadingPageImages } from "../lib/imagePreloader";
import { PageLoader } from "./ui/PageLoader";

// 포트원 타입 선언
declare global {
  interface Window {
    IMP: any;
  }
}

interface Product {
  id: number;
  title: string;
  type: "free" | "paid";
  category: string;
  image: string;
  description?: string;
  fullDescription: string;
  price: number;
  discountPrice: number;
  discountPercent: number;
}

interface Coupon {
  id: string;
  name: string;
  discount: number;
  description?: string;
}

interface UserCoupon {
  id: string;
  is_used: boolean;
  expired_at: string | null;
  coupons: {
    id: string;
    name: string;
    discount_amount: number;
    coupon_type: string;
  };
}

interface PaymentProps {
  product?: Product;
  productId?: string;
  contentId?: string;
  onBack: () => void;
  onPurchase: () => void;
  onNavigateToTermsOfService?: () => void;
  onNavigateToPrivacyPolicy?: () => void;
}

function HomeIndicatorLight() {
  return null;
}

export default function PaymentNew({
  product,
  productId,
  contentId,
  onBack,
  onPurchase,
  onNavigateToTermsOfService,
  onNavigateToPrivacyPolicy,
}: PaymentProps) {
  const [isCouponSheetOpen, setIsCouponSheetOpen] =
    useState(false);
  const [selectedCoupon, setSelectedCoupon] =
    useState<Coupon | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<"kakaopay" | "card">("kakaopay");
  const [contentData, setContentData] = useState<any>(null);
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  // ⭐ contentId가 있으면 초기 로딩 상태를 true로 설정 (스켈레톤 즉시 표시)
  const [isLoadingContent, setIsLoadingContent] =
    useState(!!contentId);
  // ⭐ 초기값 true (쿠폰 로딩 완료 전 스켈레톤 표시)
  const [isLoadingCoupons, setIsLoadingCoupons] =
    useState(true);
  const [isPortOneReady, setIsPortOneReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<
    string | null
  >(null);
  const [isSessionExpired, setIsSessionExpired] =
    useState(false);

  const navigate = useNavigate();

  // ⭐ 결제 진행 중 뒤로가기 감지를 위한 ref (상태보다 빠르게 감지)
  const paymentInitiatedRef = useRef(false);
  // ⭐ 결제 오버레이 감지용 interval ref
  const paymentOverlayCheckRef = useRef<NodeJS.Timeout | null>(null);

  // ⭐ 결제 오버레이 감지 시작/중지 함수
  const startPaymentOverlayWatch = (finalContentId: string | undefined) => {
    // 이미 실행 중이면 중복 방지
    if (paymentOverlayCheckRef.current) return;

    console.log('👀 [PaymentNew] 결제 오버레이 감지 시작');

    // 첫 번째 체크에서 오버레이가 있는지 확인 (기준점 설정)
    let overlayWasFound = false;

    paymentOverlayCheckRef.current = setInterval(() => {
      // 결제가 진행 중인 상태에서만 체크
      if (!paymentInitiatedRef.current) {
        stopPaymentOverlayWatch();
        return;
      }

      // 포트원 결제 오버레이 감지 (다양한 방식으로 생성됨)
      // 1. iframe 방식: src에 결제 관련 URL 포함
      // 2. div 오버레이 방식: body에 직접 추가되는 div
      const allIframes = document.querySelectorAll('iframe');
      let paymentFrame: Element | null = null;

      // 모든 iframe 검사 (실제로 보이는 것만)
      allIframes.forEach(iframe => {
        const src = iframe.getAttribute('src') || '';
        const isVisible = iframe.offsetParent !== null &&
                          getComputedStyle(iframe).display !== 'none' &&
                          getComputedStyle(iframe).visibility !== 'hidden';

        if (isVisible && (
            src.includes('iamport') ||
            src.includes('kakaopay') ||
            src.includes('inicis') ||
            src.includes('danal') ||
            src.includes('service.iamport.kr'))) {
          paymentFrame = iframe;
        }
      });

      // div 오버레이 검사 (포트원은 때때로 div로 오버레이 생성, 실제로 보이는 것만)
      if (!paymentFrame) {
        const divCandidates = [
          document.querySelector('div[class*="imp-"]'),
          document.querySelector('div[id*="imp-"]'),
          document.querySelector('.imp-dialog'),
          document.querySelector('#imp-ui-container')
        ].filter(Boolean) as HTMLElement[];

        for (const div of divCandidates) {
          const isVisible = div.offsetParent !== null &&
                            getComputedStyle(div).display !== 'none' &&
                            getComputedStyle(div).visibility !== 'hidden';
          if (isVisible) {
            paymentFrame = div;
            break;
          }
        }
      }

      // 디버깅: 현재 찾은 오버레이 상태 로깅 (5초마다)
      const now = Date.now();
      if (now % 5000 < 500) {
        console.log('👀 [PaymentNew] 오버레이 체크:', {
          found: !!paymentFrame,
          iframeCount: allIframes.length,
          paymentInitiated: paymentInitiatedRef.current,
          overlayWasFound
        });
      }

      // 오버레이가 처음 발견됨
      if (paymentFrame && !overlayWasFound) {
        overlayWasFound = true;
        console.log('✅ [PaymentNew] 결제 오버레이 발견:', paymentFrame);

        // ✅ 로딩 상태 해제 (결제 UI가 준비됨)
        setIsProcessingPayment(false);
      }

      // 오버레이가 있었다가 사라졌고, 아직 콜백을 받지 못한 상태 = 사용자가 닫음/뒤로감
      if (overlayWasFound && !paymentFrame && paymentInitiatedRef.current) {
        console.log('🔄 [PaymentNew] 결제 오버레이 사라짐 감지 → 상품 상세로 리다이렉트');
        stopPaymentOverlayWatch();
        paymentInitiatedRef.current = false;
        setIsProcessingPayment(false);
        window.history.replaceState({}, '', window.location.href);

        if (finalContentId) {
          navigate(`/product/${finalContentId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    }, 500); // 500ms 간격으로 체크
  };

  const stopPaymentOverlayWatch = () => {
    if (paymentOverlayCheckRef.current) {
      console.log('🛑 [PaymentNew] 결제 오버레이 감지 중지');
      clearInterval(paymentOverlayCheckRef.current);
      paymentOverlayCheckRef.current = null;
    }
  };

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      stopPaymentOverlayWatch();
    };
  }, []);

  // ⭐ 결제 오버레이가 아직 열려있는지 확인하는 함수
  const isPaymentOverlayOpen = (): boolean => {
    const allIframes = document.querySelectorAll('iframe');
    let paymentFrameExists = false;

    // iframe 검사 (실제로 보이는 것만)
    allIframes.forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      const isVisible = iframe.offsetParent !== null &&
                        getComputedStyle(iframe).display !== 'none' &&
                        getComputedStyle(iframe).visibility !== 'hidden';

      if (isVisible && (
          src.includes('iamport') ||
          src.includes('kakaopay') ||
          src.includes('inicis') ||
          src.includes('danal') ||
          src.includes('service.iamport.kr'))) {
        paymentFrameExists = true;
      }
    });

    // div 오버레이 검사 (실제로 보이는 것만)
    if (!paymentFrameExists) {
      const divCandidates = [
        document.querySelector('div[class*="imp-"]'),
        document.querySelector('div[id*="imp-"]'),
        document.querySelector('.imp-dialog'),
        document.querySelector('#imp-ui-container')
      ].filter(Boolean) as HTMLElement[];

      for (const div of divCandidates) {
        const isVisible = div.offsetParent !== null &&
                          getComputedStyle(div).display !== 'none' &&
                          getComputedStyle(div).visibility !== 'hidden';
        if (isVisible) {
          paymentFrameExists = true;
          break;
        }
      }
    }

    return paymentFrameExists;
  };

  // ⭐ 결제 중 뒤로가기 처리 (iOS Safari 스와이프, 브라우저 뒤로가기 버튼 대응)
  useEffect(() => {
    const finalContentId = contentId || productId;

    const redirectToProductDetail = () => {
      console.log('🔄 [PaymentNew] 결제 중 뒤로가기/복귀 감지 → 상품 상세로 리다이렉트');
      stopPaymentOverlayWatch();
      paymentInitiatedRef.current = false;
      setIsProcessingPayment(false);
      if (finalContentId) {
        navigate(`/product/${finalContentId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };

    // ⭐ popstate: 브라우저 뒤로가기/앞으로가기 버튼 클릭 시 발생
    const handlePopState = () => {
      console.log('🔄 [PaymentNew] popstate 이벤트, paymentInitiated:', paymentInitiatedRef.current);

      if (paymentInitiatedRef.current) {
        // ⭐ 결제 오버레이가 아직 열려있으면 리다이렉트하지 않음
        if (isPaymentOverlayOpen()) {
          console.log('⚠️ [PaymentNew] popstate: 결제 오버레이가 아직 열려있음 → 리다이렉트 취소');
          return;
        }

        console.log('✅ [PaymentNew] popstate: 결제 오버레이 닫힘 확인 → 리다이렉트');
        redirectToProductDetail();
        return;
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('🔄 [PaymentNew] pageshow 이벤트, persisted:', event.persisted, ', paymentInitiated:', paymentInitiatedRef.current);

      if (paymentInitiatedRef.current) {
        // ⭐ 결제 오버레이가 아직 열려있으면 리다이렉트하지 않음
        if (isPaymentOverlayOpen()) {
          console.log('⚠️ [PaymentNew] pageshow: 결제 오버레이가 아직 열려있음 → 리다이렉트 취소');
          return;
        }

        console.log('✅ [PaymentNew] pageshow: 결제 오버레이 닫힘 확인 → 리다이렉트');
        redirectToProductDetail();
        return;
      }

      if (event.persisted) {
        setIsProcessingPayment(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [PaymentNew] visibilitychange visible, paymentInitiated:', paymentInitiatedRef.current);

        if (paymentInitiatedRef.current) {
          // ⭐ 결제 오버레이가 아직 열려있으면 리다이렉트하지 않음
          if (isPaymentOverlayOpen()) {
            console.log('⚠️ [PaymentNew] visibilitychange: 결제 오버레이가 아직 열려있음 → 리다이렉트 취소');
            return;
          }

          console.log('✅ [PaymentNew] visibilitychange: 결제 오버레이 닫힘 확인 → 리다이렉트');
          redirectToProductDetail();
          return;
        }

        setIsProcessingPayment(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contentId, productId, navigate]);

  // contentId가 있으면 DB에서 데이터 로드
  useEffect(() => {
    if (contentId) {
      const fetchContent = async () => {
        setIsLoadingContent(true);
        try {
          const { data, error } = await supabase
            .from("master_contents")
            .select("*")
            .eq("id", contentId)
            .single();

          if (error) throw error;
          setContentData(data);
        } catch (error) {
          console.error("콘텐츠 로드 실패:", error);
          alert("콘텐츠 정보를 불러오는데 실패했습니다.");
        } finally {
          setIsLoadingContent(false);
        }
      };

      fetchContent();
    }
  }, [contentId]);

  // 사용 가능한 쿠폰 조회
  useEffect(() => {
    const fetchUserCoupons = async () => {
      setIsLoadingCoupons(true);
      try {
        const userJson = localStorage.getItem("user");
        const user = userJson ? JSON.parse(userJson) : null;

        if (!user?.id) {
          console.log("로그인되지 않은 사용자");
          setIsLoadingCoupons(false);
          return;
        }

        console.log("🎟️ 쿠폰 조회 시작:", user.id);

        const { data, error } = await supabase
          .from("user_coupons")
          .select(
            `
            id,
            is_used,
            expired_at,
            coupons (
              id,
              name,
              discount_amount,
              coupon_type
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("is_used", false);

        if (error) {
          console.error("❌ 쿠폰 조회 실패:", error);
          setUserCoupons([]);
        } else if (data) {
          console.log("✅ 쿠폰 조회 성공:", data);

          // 클라이언트 사이드에서 만료 여부 필터링
          const now = new Date();
          const validCoupons = data.filter(
            (uc) =>
              !uc.expired_at || new Date(uc.expired_at) > now,
          );

          // UserCoupon 데이터를 Coupon 형태로 변환
          const coupons: Coupon[] = validCoupons
            .map((uc) => ({
              id: uc.id,
              name: uc.coupons.name,
              discount: uc.coupons.discount_amount,
              description: `${uc.coupons.coupon_type} 쿠폰`,
            }))
            // discount_amount 기준 내림차순 정렬
            .sort((a, b) => b.discount - a.discount);

          console.log("✅ 정렬된 쿠폰:", coupons);
          setUserCoupons(coupons);

          // 가장 높은 금액의 쿠폰 자동 선택
          if (coupons.length > 0) {
            setSelectedCouponId(coupons[0].id);
            setSelectedCoupon(coupons[0]);
            console.log("✅ 자동 선택된 쿠폰:", coupons[0]);
          }
        }
      } catch (error) {
        console.error("❌ 쿠폰 조회 중 오류:", error);
        setUserCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    };

    fetchUserCoupons();
  }, []);

  // product 또는 contentData에서 가격 정보 추출
  const currentProduct =
    product ||
    (contentData
      ? {
          id: parseInt(contentId || "0"),
          title: contentData.title,
          type: contentData.content_type as "free" | "paid",
          category: contentData.category_main,
          image: contentData.thumbnail_url || "",
          description: contentData.description || "",
          fullDescription: contentData.description || "",
          price: contentData.price_original,
          discountPrice:
            contentData.price_discount ||
            contentData.price_original,
          discountPercent: contentData.discount_rate,
        }
      : null);

  const basePrice = currentProduct ? currentProduct.price : 0;
  const specialDiscount = currentProduct
    ? currentProduct.price - currentProduct.discountPrice
    : 0;
  const rawCouponDiscount = selectedCoupon
    ? selectedCoupon.discount
    : 0;
  // ⭐ 쿠폰 할인은 할인된 가격까지만 적용 (음수 방지)
  const maxCouponDiscount = currentProduct
    ? currentProduct.discountPrice
    : 0;
  const couponDiscount = Math.min(
    rawCouponDiscount,
    maxCouponDiscount,
  );
  const totalPrice = Math.max(
    0,
    currentProduct
      ? currentProduct.discountPrice - couponDiscount
      : 0,
  );

  // 포트원 SDK 로드 및 초기화
  useEffect(() => {
    // 이미 로드된 경우
    if (window.IMP) {
      window.IMP.init("imp38022226");
      setIsPortOneReady(true);
      console.log("✅ 포트원 이미 로드됨");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    script.onload = () => {
      if (window.IMP) {
        window.IMP.init("imp38022226");
        setIsPortOneReady(true);
        console.log("✅ 포트원 초기화 완료");
      }
    };
    script.onerror = () => {
      console.error("❌ 포트원 스크립트 로드 실패");
      alert(
        "결제 모듈을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.",
      );
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleCouponSelect = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
  };

  const handleApplyCoupon = () => {
    setIsCouponSheetOpen(false);
  };

  const handlePurchaseClick = async () => {
    // ⭐ 중복 클릭 방지
    if (isProcessingPayment) {
      console.log('⚠️ [PaymentNew] 이미 결제 처리 중 - 중복 클릭 무시');
      return;
    }

    // ⭐️ 로그인 체크 추가
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user?.id) {
      alert("로그인이 필요한 서비스입니다.");
      onBack();
      return;
    }

    // ⭐ 즉시 로딩 상태 활성화 (버튼 클릭 즉시 피드백)
    setIsProcessingPayment(true);
    console.log('🔄 [PaymentNew] 결제 처리 시작 - 로딩 표시');

    const finalContentId = contentId || productId;

    // 결제금액이 0원이면 바로 주문 저장 후 다음 단계로 (PG 호출 없음)
    if (totalPrice === 0) {
      // ⭐ 0원 결제는 PG 리다이렉트가 없으므로 ref 설정 불필요
      try {
        const merchantUid = `order_${Date.now()}`;

        console.log("💰 0원 결제 - saveOrder 호출 시작:", {
          user_id: user.id,
          content_id: finalContentId,
          merchant_uid: merchantUid,
        });

        const savedOrder = await saveOrder({
          user_id: user.id,
          content_id: finalContentId,
          paid_amount: 0,
          pay_method: "free",
          merchant_uid: merchantUid,
          pstatus: "completed",
          pg_provider: "coupon",
        });

        console.log("✅ 0원 주문 저장 완료:", savedOrder);

        // ⭐ 구매내역 캐시 무효화 (새 구매 즉시 반영)
        localStorage.removeItem('purchase_history_cache');
        console.log('🗑️ 구매내역 캐시 무효화 완료');

        // ⭐️ 쿠폰 사용 처리
        if (selectedCouponId && savedOrder?.id) {
          console.log("🎟️ [0원결제] 쿠폰 사용 처리 시작:", {
            userCouponId: selectedCouponId,
            orderId: savedOrder.id,
          });

          // 쿠폰 사용 전 상태 확인
          const { data: beforeUpdate } = await supabase
            .from("user_coupons")
            .select("*, coupons(name, discount_amount)")
            .eq("id", selectedCouponId)
            .single();

          console.log(
            "📋 [0원결제] 쿠폰 사용 전 상태:",
            beforeUpdate,
          );

          const { data: updatedCoupon, error: couponError } =
            await supabase
              .from("user_coupons")
              .update({
                is_used: true,
                used_at: new Date().toISOString(),
                used_order_id: savedOrder.id,
              })
              .eq("id", selectedCouponId)
              .select("*, coupons(name, discount_amount)")
              .single();

          if (couponError) {
            console.error(
              "❌ [0원결제] 쿠폰 사용 처리 실패:",
              couponError,
            );
          } else {
            console.log("✅ [0원결제] 쿠폰 사용 처리 완료:", {
              userCouponId: selectedCouponId,
              couponName: updatedCoupon?.coupons?.name,
              isUsed: updatedCoupon?.is_used,
              usedAt: updatedCoupon?.used_at,
              usedOrderId: updatedCoupon?.used_order_id,
            });
          }
        }

        // ⭐️ orderId를 localStorage에 저장
        if (savedOrder?.id) {
          localStorage.setItem("pendingOrderId", savedOrder.id);
          console.log("📦 저장된 orderId:", savedOrder.id);
        }

        // ⭐ 로딩 페이지 이미지 미리 로드
        preloadLoadingPageImages();

        onPurchase();
      } catch (error) {
        console.error("❌ 0원 주문 저장 실패:", error);
        alert("주문 저장에 실패했습니다. 다시 시도해주세요.");
        setIsProcessingPayment(false); // ⭐ 에러 시 로딩 해제
      }
      return;
    }

    if (!isPortOneReady) {
      alert(
        "결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
      );
      setIsProcessingPayment(false); // ⭐ 에러 시 로딩 해제
      return;
    }

    console.log('🔄 [PaymentNew] 유료 결제 PG 호출 시작');

    // 결제 수단에 따른 PG 설정
    const pgProvider =
      selectedPaymentMethod === "kakaopay"
        ? "kakaopay.CAAHYG5DKD"
        : "danal_tpay.A010076393";

    // 주문 번호 생성
    const merchantUid = `order_${Date.now()}`;

    // 모바일 리다이렉트 URL 설정
    const redirectUrl = `${window.location.origin}/payment/complete?contentId=${finalContentId}&amount=${totalPrice}&payMethod=${selectedPaymentMethod === "kakaopay" ? "kakaopay" : "card"}&userCouponId=${selectedCouponId || ""}`;

    // 결제 요청 파라미터 구성
    const paymentParams: any = {
      pg: pgProvider,
      pay_method: "card",
      merchant_uid: merchantUid,
      name: currentProduct ? currentProduct.title : "운세 구성",
      amount: totalPrice,
      buyer_name: "구매자명",
      buyer_tel: "010-0000-0000",
      m_redirect_url: redirectUrl,
      popup: false,
    };

    // 다날 카드결제 시 디지털 상품 설정
    if (selectedPaymentMethod === "card") {
      paymentParams.digital = true;
    }

    // 포트원 결제 요청
    // ⭐ PG 팝업/리다이렉트 전에 ref 설정 (뒤로가기 감지용)
    paymentInitiatedRef.current = true;

    // ⭐ 결제창 열기 전 history에 상태 푸시 (뒤로가기 시 popstate 이벤트 발생 보장)
    window.history.pushState({ paymentInProgress: true }, '', window.location.href);

    // ⭐ 결제 오버레이 감지 시작 (iframe이 사라지면 뒤로가기로 판단)
    // 약간의 딜레이 후 시작 (iframe이 로드될 시간 확보)
    setTimeout(() => {
      startPaymentOverlayWatch(finalContentId);
    }, 1000);

    console.log('🔄 [PaymentNew] 포트원 결제 요청 시작, paymentInitiated:', paymentInitiatedRef.current);

    window.IMP.request_pay(
      paymentParams,
      async function (response: any) {
        // ⭐ 콜백 실행 = 정상 플로우 → ref 리셋 및 오버레이 감지 중지
        stopPaymentOverlayWatch();
        paymentInitiatedRef.current = false;
        setIsProcessingPayment(false);
        console.log('🔄 [PaymentNew] 포트원 콜백 수신, success:', response.success);

        if (response.success) {
          try {
            const savedOrder = await saveOrder({
              user_id: user.id,
              content_id: finalContentId,
              paid_amount: totalPrice,
              pay_method:
                selectedPaymentMethod === "kakaopay"
                  ? "kakaopay"
                  : "card",
              imp_uid: response.imp_uid,
              merchant_uid: response.merchant_uid,
              pstatus: "completed",
              pg_provider: pgProvider,
            });

            console.log(
              "결제 성공 및 주문 저장 완료:",
              response.imp_uid,
              response.merchant_uid,
            );

            // ⭐ 구매내역 캐시 무효화 (새 구매 즉시 반영)
            localStorage.removeItem('purchase_history_cache');
            console.log('🗑️ 구매내역 캐시 무효화 완료');

            // ⭐️ 폰 사용 처리 (유료 결제)
            if (selectedCouponId && savedOrder?.id) {
              console.log(
                "🎟️ [유료결제] 쿠폰 사용 처리 시작:",
                {
                  userCouponId: selectedCouponId,
                  orderId: savedOrder.id,
                },
              );

              // 쿠폰 사용 전 상태 확인
              const { data: beforeUpdate } = await supabase
                .from("user_coupons")
                .select("*, coupons(name, discount_amount)")
                .eq("id", selectedCouponId)
                .single();

              console.log(
                "📋 [유료결제] 쿠폰 사용 전 상태:",
                beforeUpdate,
              );

              const {
                data: updatedCoupon,
                error: couponError,
              } = await supabase
                .from("user_coupons")
                .update({
                  is_used: true,
                  used_at: new Date().toISOString(),
                  used_order_id: savedOrder.id,
                })
                .eq("id", selectedCouponId)
                .select("*, coupons(name, discount_amount)")
                .single();

              if (couponError) {
                console.error(
                  "❌ [유료결제] 쿠폰 사용 처리 실패:",
                  couponError,
                );
              } else {
                console.log(
                  "✅ [유료결제] 쿠폰 사용 처리 완료:",
                  {
                    userCouponId: selectedCouponId,
                    couponName: updatedCoupon?.coupons?.name,
                    isUsed: updatedCoupon?.is_used,
                    usedAt: updatedCoupon?.used_at,
                    usedOrderId: updatedCoupon?.used_order_id,
                  },
                );
              }
            }

            // ⭐️ orderId를 localStorage에 저장
            if (savedOrder?.id) {
              localStorage.setItem(
                "pendingOrderId",
                savedOrder.id,
              );
              console.log("📦 저장된 orderId:", savedOrder.id);
            }

            // ⭐ 로딩 페이지 이미지 미리 로드
            preloadLoadingPageImages();

            // ⭐ 결제 성공 시 푸시된 history state 정리 후 다음 페이지로 이동
            window.history.replaceState({}, '', window.location.href);
            onPurchase();
          } catch (error) {
            console.error("주문 저장 실패:", error);
            // ⭐ 에러 시에도 history state 정리
            window.history.replaceState({}, '', window.location.href);
            alert(
              "결제는 완료되었으나 주문 저장에 실패했습니다. 고객센터에 문의해주세요.",
            );
          }
        } else {
          // ⭐ 결제 실패/취소 시 푸시된 history state 정리 (네비게이션 없이 state만 제거)
          window.history.replaceState({}, '', window.location.href);
          alert("결제 실패: " + response.error_msg);
        }
      },
    );
  };

  // ⭐ 콘텐츠 + 쿠폰 모두 로딩 완료 후 표시 (가격+혜택가 동시 표시)
  if (isLoadingContent || isLoadingCoupons) {
    return <PaymentSkeleton />;
  }

  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <style>{`
        body::-webkit-scrollbar {
          display: none;
        }
        body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* 결제 처리 중 전체화면 로딩 */}
      {/* ⭐ 0원 결제: "잠시만 기다려주세요", 유료 결제: "결제 페이지로 이동 중..." */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-50">
          <PageLoader message={totalPrice === 0 ? "잠시만 기다려주세요" : "결제 페이지로 이동 중..."} />
        </div>
      )}

      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
        {/* Top Navigation */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex items-center justify-between px-[12px] h-full w-full">
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
            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold text-[18px] text-black text-center tracking-[-0.36px]">
              결제
            </p>
            <div className="opacity-0 p-[4px] size-[44px]" />
          </div>
        </div>

        {/* ⭐ Scrollable Content Area - overscroll-contain으로 iOS 바운스 방지 */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-[100px]">
        {/* Main Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            hidden: { opacity: 0 }
          }}
          className="content-stretch flex flex-col gap-[32px] items-center w-full  max-w-[440px] mt-[14px] mx-auto">
          {/* 운세 구성 섹션 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full max-w-[440px] px-[20px]">
            <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                  <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                    운세 구성
                  </p>
                </div>
                <button
                  onClick={() => setIsCouponSheetOpen(true)}
                  disabled={userCoupons.length === 0}
                  className={`group content-stretch flex h-[32px] items-center justify-center px-[12px] py-0 relative rounded-[8px] shrink-0 transition-colors duration-200 ease-out ${
                    userCoupons.length === 0 
                      ? 'bg-[#f8f8f8] cursor-not-allowed border-0' 
                      : 'bg-transparent border border-[#e7e7e7] cursor-pointer active:bg-gray-100'
                  }`}
                >
                  <div className={`content-stretch flex font-['Pretendard_Variable:Medium',sans-serif] font-medium gap-[8px] items-center leading-[22px] relative shrink-0 text-[13px] text-nowrap ${
                    userCoupons.length === 0 
                      ? 'text-[#b7b7b7]' 
                      : 'text-[#848484] transition-transform duration-200 ease-out group-active:scale-95'
                  }`}>
                    <p className="relative shrink-0">쿠폰</p>
                    <p className="relative shrink-0">
                      {userCoupons.length}
                    </p>
                  </div>
                </button>
              </div>
              <div className="h-0 relative shrink-0 w-full">
                <div className="absolute inset-[-0.5px_0]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#F3F3F3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 상품 카드 */}
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full mb-[-6px]">
              <div className="h-[54px] pointer-events-none relative rounded-[12px] shrink-0 w-[80px] overflow-hidden">
                {currentProduct?.image ? (
                  <img
                    alt=""
                    className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full"
                    src={currentProduct.image}
                    onError={(e) => {
                      console.error(
                        "이미지 로드 실패:",
                        currentProduct.image,
                      );
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#f3f3f3] flex items-center justify-center rounded-[12px]">
                    <p className="text-[#999] text-[12px]">
                      이미지
                    </p>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute border border-[#f9f9f9] border-solid inset-[-1px] rounded-[13px]"
                />
              </div>
              <div className="basis-0 content-stretch flex flex-col gap-[12px] grow items-end min-h-px min-w-px relative shrink-0">
                <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                  <div className="bg-[#f0f8f8] content-stretch flex items-center justify-center px-[6px] py-[2px] relative rounded-[4px] shrink-0 pt-[4px] pr-[6px] pb-[2px] pl-[6px]">
                    <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[#41a09e] text-[12px] text-nowrap tracking-[-0.24px]">
                      심화 해석판
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <div className="relative shrink-0 w-full">
                      <div className="size-full">
                        <div className="content-stretch flex flex-col items-start px-px py-0 relative w-full">
                          <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px] w-full mb-[-6px]">
                            {currentProduct
                              ? currentProduct.title
                              : "운세 구성"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative shrink-0 w-full">
                    <div className="size-full">
                      <div className="content-stretch flex flex-col gap-[2px] items-start px-[2px] py-0 relative w-full">
                        <div className="content-stretch flex items-center relative shrink-0">
                          <div className="content-stretch flex items-center px-px py-0 relative shrink-0">
                            <div className="content-stretch flex items-center relative shrink-0">
                              <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] line-through relative shrink-0 text-[#999] text-[13px] text-nowrap">
                                {basePrice.toLocaleString()}원
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* ⭐ 쿠폰 유무에 따라 가격 표시 방식 변경 */}
                        {selectedCoupon ? (
                          // 쿠폰 있을 때: 최종가격(청록색) + "특별할인 + 쿠폰 적용가" 텍스트
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0 text-[#48b2af] text-nowrap w-full mt-[-3px]">
                            <p className="font-['Pretendard_Variable:Bold',sans-serif] font-bold leading-[25px] relative shrink-0 text-[16px] tracking-[-0.32px]">
                              {(
                                basePrice -
                                specialDiscount -
                                couponDiscount
                              ).toLocaleString()}
                              원
                            </p>
                            <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[16px] relative shrink-0 text-[11px] pt-[1px]">
                              특별할인 + 쿠폰 적용가
                            </p>
                          </div>
                        ) : (
                          // 쿠폰 없을 때: 할인율(빨간색) + 할인가(검정색)만 표시
                          <div className="content-stretch flex font-['Pretendard_Variable:Bold',sans-serif] font-bold gap-[2px] items-center leading-[20px] relative shrink-0 text-[15px] text-nowrap tracking-[-0.45px]">
                            <p className="relative shrink-0 text-[#ff6678]">
                              {currentProduct?.discountPercent || 0}%
                            </p>
                            <p className="relative shrink-0 text-black">
                              {(basePrice - specialDiscount).toLocaleString()}원
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 쿠폰 사용 안내 - 할인 적용 시에만 표시 */}
            {selectedCoupon && (
              <div className="bg-[#f0f8f8] relative rounded-[12px] shrink-0 w-full">
                <div
                  aria-hidden="true"
                  className="absolute border border-[#7ed4d2] border-solid inset-0 pointer-events-none rounded-[12px]"
                />
                <div className="flex flex-col items-center justify-center size-full">
                  <div className="content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative w-full">
                    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full">
                      <div className="relative shrink-0 size-[20px]">
                        <svg
                          className="block size-full"
                          fill="none"
                          preserveAspectRatio="none"
                          viewBox="0 0 20 20"
                        >
                          <g id="flash">
                            <path
                              d={svgPaths.p12d62f00}
                              fill="#48B2AF"
                            />
                          </g>
                        </svg>
                      </div>
                      <p className="font-['Pretendard_Variable:Medium',sans-serif] font-semibold leading-[22px] relative text-[#48b2af] text-[13px] whitespace-normal break-words tracking-[-0.42px]">
                        특별 할인 + 쿠폰 사용으로 이번 결제는{" "}
                        {totalPrice.toLocaleString()}원이에요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* 회색 구분선 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="bg-[#f9f9f9] h-[12px] shrink-0 w-full mt-[-16px]"
          />

          {/* 결제 금액 섹션 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="content-stretch flex flex-col gap-[44px] items-start relative shrink-0 w-full"
          >
            <div className="content-stretch flex flex-col gap-[20px] items-center relative shrink-0 w-full">
              <div className="relative shrink-0 w-full">
                <div className="size-full">
                  <div className="content-stretch flex flex-col gap-[16px] items-start px-[20px] py-0 relative w-full">
                    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                            결제 금액
                          </p>
                        </div>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-0.5px_0]">
                          <svg
                            className="block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#F3F3F3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-center size-full">
                          <div className="content-stretch flex items-center justify-between px-[2px] py-0 relative text-nowrap w-full">
                            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px]">
                              상품 금액
                            </p>
                            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                              {basePrice.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-center size-full">
                          <div className="content-stretch flex items-center justify-between px-[2px] py-0 relative text-nowrap w-full">
                            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px]">
                              기본 할인
                            </p>
                            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                              -
                              {specialDiscount.toLocaleString()}
                              원
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-center size-full">
                          <div className="content-stretch flex items-center justify-between px-[2px] py-0 relative text-nowrap w-full">
                            <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[15px] text-black tracking-[-0.3px]">
                              쿠폰 할인
                            </p>
                            <p className="font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold leading-[25px] relative shrink-0 text-[#151515] text-[16px] tracking-[-0.32px]">
                              -{couponDiscount.toLocaleString()}
                              원
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f9f9f9] relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex items-center justify-between px-[20px] py-[24px] relative w-full">
                    <div className="basis-0 content-stretch flex font-['Pretendard_Variable:Bold',sans-serif] font-bold grow items-center justify-between leading-[24px] min-h-px min-w-px relative shrink-0 text-nowrap">
                      <p className="relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                        총 결제 금액
                      </p>
                      <p className="font-bold relative shrink-0 text-[#48b2af] text-[18px] tracking-[-0.36px]">
                        {totalPrice.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 수단 섹션 */}
            <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
              <div className="relative shrink-0 w-full">
                <div className="size-full">
                  <div className="content-stretch flex flex-col gap-[16px] items-start px-[20px] py-0 relative w-full mt-[-8px]">
                    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                        <div className="basis-0 content-stretch flex grow items-center justify-center min-h-px min-w-px relative shrink-0">
                          <p className="basis-0 font-['Pretendard_Variable:SemiBold',sans-serif] font-semibold grow leading-[24px] min-h-px min-w-px relative shrink-0 text-[17px] text-black tracking-[-0.34px]">
                            결제 수단
                          </p>
                        </div>
                      </div>
                      <div className="h-0 relative shrink-0 w-full">
                        <div className="absolute inset-[-0.5px_0]">
                          <svg
                            className="block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                          >
                            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#F3F3F3" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="content-stretch flex flex-col gap-[12px] h-[84px] items-start relative shrink-0 w-full">
                      {/* 카카오페이 */}
                      <button
                        onClick={() =>
                          setSelectedPaymentMethod("kakaopay")
                        }
                        className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full bg-transparent border-none cursor-pointer p-0"
                      >
                        <div className="content-stretch flex items-center justify-center relative shrink-0 size-[36px]">
                          {selectedPaymentMethod ===
                          "kakaopay" ? (
                            <div className="relative rounded-[999px] shrink-0 size-[20px]">
                              <div
                                aria-hidden="true"
                                className="absolute border-[#48b2af] border-[6px] border-solid inset-0 pointer-events-none rounded-[999px]"
                              />
                            </div>
                          ) : (
                            <div className="bg-white relative rounded-[999px] shrink-0 size-[20px]">
                              <div
                                aria-hidden="true"
                                className="absolute border-2 border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[999px]"
                              />
                            </div>
                          )}
                        </div>
                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                          <div className="bg-[#fbeb4f] content-stretch flex flex-col items-center justify-center relative rounded-[999px] shrink-0 size-[28px]">
                            <div className="h-[6px] relative shrink-0 w-[20px]">
                              <svg
                                className="block size-full"
                                fill="none"
                                preserveAspectRatio="none"
                                viewBox="0 0 20 6"
                              >
                                <g id="Group 427318818">
                                  <path
                                    clipRule="evenodd"
                                    d={svgPaths.p18b2da80}
                                    fill="black"
                                    fillRule="evenodd"
                                  />
                                  <path
                                    d={svgPaths.p58ec500}
                                    fill="black"
                                  />
                                  <path
                                    d={svgPaths.p22159380}
                                    fill="black"
                                  />
                                  <path
                                    d={svgPaths.pbb49340}
                                    fill="black"
                                  />
                                </g>
                              </svg>
                            </div>
                          </div>
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[15px] text-black text-nowrap tracking-[-0.3px]">
                            카카오페이
                          </p>
                        </div>
                      </button>

                      {/* 신용·체크카드 */}
                      <button
                        onClick={() =>
                          setSelectedPaymentMethod("card")
                        }
                        className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full bg-transparent border-none cursor-pointer p-0"
                      >
                        <div className="content-stretch flex items-center justify-center relative shrink-0 size-[36px]">
                          {selectedPaymentMethod === "card" ? (
                            <div className="relative rounded-[999px] shrink-0 size-[20px]">
                              <div
                                aria-hidden="true"
                                className="absolute border-[#48b2af] border-[6px] border-solid inset-0 pointer-events-none rounded-[999px]"
                              />
                            </div>
                          ) : (
                            <div className="bg-white relative rounded-[999px] shrink-0 size-[20px]">
                              <div
                                aria-hidden="true"
                                className="absolute border-2 border-[#e7e7e7] border-solid inset-0 pointer-events-none rounded-[999px]"
                              />
                            </div>
                          )}
                        </div>
                        <div className="content-stretch flex gap-[8px] items-center pl-[2px] pr-0 py-0 relative shrink-0">
                          <div className="relative shrink-0 size-[24px]">
                            <svg
                              className="block size-full"
                              fill="none"
                              preserveAspectRatio="none"
                              viewBox="0 0 24 24"
                            >
                              <g id="card">
                                <path
                                  d={svgPaths.p1b287980}
                                  fill="#525252"
                                />
                                <path
                                  d={svgPaths.pba16da0}
                                  fill="#525252"
                                />
                                <path
                                  d={svgPaths.p1b797780}
                                  fill="#525252"
                                />
                                <path
                                  d={svgPaths.p3f2a0500}
                                  fill="#525252"
                                />
                              </g>
                            </svg>
                          </div>
                          <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[25.5px] relative shrink-0 text-[15px] text-black text-nowrap tracking-[-0.3px]">
                            신용 · 체크카드
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 회색 구분선 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="bg-[#f9f9f9] h-[12px] shrink-0 w-full"
          />

          {/* 약관 동의 섹션 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="content-stretch flex flex-col gap-[16px] items-start px-[20px] py-0 relative shrink-0 w-full"
          >
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <p className="font-['Pretendard_Variable:Regular',sans-serif] font-normal leading-[22px] relative shrink-0 text-[#525252] text-[14px] tracking-[-0.42px] w-full">
                  결제 금액과 안내 사항을 확인했어요
                </p>
              </div>
              <div className="h-0 relative shrink-0 w-full">
                <div className="absolute inset-[-0.5px_0]">
                  <svg
                    className="block size-full"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="#F3F3F3" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#525252] text-[13px] tracking-[-0.26px] w-full">
                  <p className="leading-[19px]">
                    개인정보 수집 이용 동의
                  </p>
                </div>
              </div>

              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d6d6d] text-[13px] tracking-[-0.26px] w-full">
                    <p className="leading-[19px] mb-0">
                      수집 및 이용 목적
                    </p>
                    <ul>
                      <li className="list-disc ms-[19.5px]">
                        <span className="leading-[19px]">
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
                  <div className="flex flex-col font-['Pretendard_Variable:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d6d6d] text-[13px] tracking-[-0.26px] w-full">
                    <p className="leading-[19px] mb-0">
                      수집하는 개인정보 항목
                    </p>
                    <ul className="list-disc">
                      <li className="mb-0 ms-[19.5px]">
                        <span className="leading-[19px]">
                          회원 식별 정보: 이름, 이메일,
                          휴대전화번호
                        </span>
                      </li>
                      <li className="ms-[19.5px]">
                        <span className="leading-[19px]">
                          콘텐츠 생성 정보: 생년월일, 태어난 시,
                          성별
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ⚠️ [개발 전용] 결제 패스 버튼 - DEV 환경에서만 표시 */}
          {DEV && (
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="w-full px-[20px] mb-[20px] mt-[10px]"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-[16px]">
                <p className="text-red-500 text-[12px] text-center mb-[8px] font-bold">
                  ⚠️ 개발 전용 (실제 결제 건너뛰기)
                </p>
                <div className="flex flex-col gap-[8px]">
                  <button
                    onClick={() => {
                      const finalContentId = contentId || productId;
                      const devOrderId = `dev_order_${Date.now()}`;
                      // navigate 훅을 사용할 수 없는 컨텍스트이므로 window.location 사용
                      window.location.href = `/product/${finalContentId}/birthinfo?orderId=${devOrderId}&from=dev`;
                    }}
                    className="w-full h-[44px] bg-red-500 text-white rounded-[8px] font-bold text-[14px] hover:bg-red-600 transition-colors cursor-pointer border-none"
                  >
                    [DEV] 결제 완료
                  </button>
                  <button
                    onClick={() => {
                      // 결제 실패 화면으로 이동 (imp_success=false)
                      window.location.href = `/payment/complete?imp_success=false&error_msg=${encodeURIComponent('[DEV] 테스트용 결제 실패')}`;
                    }}
                    className="w-full h-[44px] bg-orange-500 text-white rounded-[8px] font-bold text-[14px] hover:bg-orange-600 transition-colors cursor-pointer border-none"
                  >
                    [DEV] 결제 실패
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="w-full max-w-[440px] mx-auto"
          >
            <Footer
              onNavigateToTerms={onNavigateToTermsOfService}
              onNavigateToPrivacy={onNavigateToPrivacyPolicy}
            />
          </motion.div>
        </motion.div>
        </div>{/* ⭐ Scrollable Container 닫기 */}

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 box-border content-stretch flex flex-col items-start shadow-[0px_-8px_16px_0px_rgba(255,255,255,0.76)] w-full max-w-[440px] z-10">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="bg-white relative shrink-0 w-full">
              <div className="flex flex-col items-center justify-center size-full">
                <div className="fixed bottom-0 left-0 w-full z-10">
                  <div className="w-full max-w-[440px] mx-auto px-[20px] pb-[12px] pt-[12px] bg-white">
                    <button
                      onClick={handlePurchaseClick}
                      disabled={isProcessingPayment}
                      className={`h-[56px] relative rounded-[16px] shrink-0 w-full border-none transition-all duration-200 ease-out ${
                        isProcessingPayment
                          ? 'bg-[#48b2af]/70 cursor-not-allowed'
                          : 'bg-[#48b2af] cursor-pointer active:scale-96 active:bg-[#41a09e]'
                      }`}
                    >
                      <div className="flex flex-row items-center justify-center size-full">
                        <div className="content-stretch flex items-center justify-center px-[12px] py-0 relative size-full">
                          <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                            {isProcessingPayment ? (
                              <div className="flex items-center gap-[8px]">
                                <div className="animate-spin rounded-full h-[20px] w-[20px] border-2 border-white border-t-transparent"></div>
                                <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                                  처리 중...
                                </p>
                              </div>
                            ) : (
                              <p className="font-['Pretendard_Variable:Medium',sans-serif] font-medium leading-[25px] relative shrink-0 text-[16px] text-nowrap text-white tracking-[-0.32px]">
                                {totalPrice.toLocaleString()}원
                                구매하기
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <HomeIndicatorLight />
        </div>
      </div>

      {/* 쿠폰 바텀시트 */}
      <CouponBottomSheetNew
        isOpen={isCouponSheetOpen}
        onClose={() => setIsCouponSheetOpen(false)}
        coupons={userCoupons}
        selectedCoupon={selectedCoupon}
        onSelectCoupon={handleCouponSelect}
        productTitle={
          currentProduct ? currentProduct.title : "운세 구성"
        }
        productImage={
          currentProduct ? currentProduct.image : ""
        }
        productCategory="심화 해석판"
        basePrice={basePrice}
        specialDiscount={specialDiscount}
        totalPrice={totalPrice}
      />

      {/* ⭐ 세션 만료 다이얼로그 (로그아웃 상태에서 결제 페이지 접근 시) */}
      <SessionExpiredDialog isOpen={isSessionExpired} />
    </div>
  );
}