/**
 * 쿠폰 관련 API 호출 헬퍼
 */

import { supabase } from './supabase';
import { projectId } from '../utils/supabase/info';

const EDGE_FUNCTION_BASE_URL = `https://${projectId}.supabase.co/functions/v1`;

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  is_used: boolean;
  used_at: string | null;
  used_order_id: string | null;
  issued_at: string;
  expired_at: string | null;
  name: string;
  coupon_type: string;
  discount_amount: number;
  description: string;
}

/**
 * 가입 축하 쿠폰 발급
 */
export async function issueWelcomeCoupon(userId: string): Promise<{ success: boolean; coupon?: UserCoupon; error?: string }> {
  try {
    console.log('🎟️ [쿠폰API] 가입 축하 쿠폰 발급 시작:', userId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/issue-welcome-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [쿠폰API] 가입 축하 쿠폰 발급 실패:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ [쿠폰API] 가입 축하 쿠폰 발급 성공:', result.coupon);
    return result;
  } catch (error: any) {
    console.error('❌ [쿠폰API] 가입 축하 쿠폰 발급 예외:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 재구매 쿠폰 발급
 * @param userId - 사용자 ID
 * @param sourceOrderId - 출처 ID (주문 ID 또는 보고서 ID) - 중복 발급 방지용
 */
export async function issueRevisitCoupon(userId: string, sourceOrderId?: string): Promise<{ success: boolean; coupon?: UserCoupon; error?: string }> {
  try {
    console.log('🎟️ [쿠폰API] 재구매 쿠폰 발급 시작:', { userId, sourceOrderId });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/issue-revisit-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_id: userId, source_order_id: sourceOrderId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [쿠폰API] 재구매 쿠폰 발급 실패:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ [쿠폰API] 재구매 쿠폰 발급 성공:', result.coupon);
    return result;
  } catch (error: any) {
    console.error('❌ [쿠폰API] 재구매 쿠폰 발급 예외:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 사용 가능한 쿠폰 조회
 */
export async function getAvailableCoupons(userId: string): Promise<{ success: boolean; coupons?: UserCoupon[]; error?: string }> {
  try {
    console.log('🎟️ [쿠폰API] 사용 가능한 쿠폰 조회 시작:', userId);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/get-available-coupons?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [쿠폰API] 쿠폰 조회 실패:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ [쿠폰API] 쿠폰 조회 성공:', result.coupons?.length + '개');
    return result;
  } catch (error: any) {
    console.error('❌ [쿠폰API] 쿠폰 조회 예외:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 주문에 쿠폰 적용
 */
export async function applyCouponToOrder(userCouponId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎟️ [쿠폰API] 쿠폰 사용 처리 시작:', { userCouponId, orderId });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('로그인이 필요합니다');
    }

    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/apply-coupon-to-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ user_coupon_id: userCouponId, order_id: orderId }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [쿠폰API] 쿠폰 사용 실패:', result.error);
      return { success: false, error: result.error };
    }

    console.log('✅ [쿠폰API] 쿠폰 사용 성공');
    return result;
  } catch (error: any) {
    console.error('❌ [쿠폰API] 쿠폰 사용 예외:', error);
    return { success: false, error: error.message };
  }
}