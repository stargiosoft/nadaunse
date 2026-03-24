# 🚀 Edge Function 업데이트 가이드

## 📍 위치
**Supabase Dashboard → Edge Functions → issue-revisit-coupon**

또는

**로컬 파일**: `/supabase/functions/issue-revisit-coupon/index.ts`

---

## ✅ 이미 로컬 파일 업데이트 완료!

`/supabase/functions/issue-revisit-coupon/index.ts` 파일이 이미 수정되었습니다!

이제 **Supabase CLI**를 사용해서 배포하거나, 아래 코드를 **Supabase Dashboard**에 수동으로 붙여넣기 하세요.

---

## 📝 업데이트된 코드

로컬 파일(`/supabase/functions/issue-revisit-coupon/index.ts`)과 동일한 코드입니다:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // ⭐ source_order_id 추가
    const { user_id, source_order_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ source_order_id 필수 체크
    if (!source_order_id) {
      return new Response(
        JSON.stringify({ error: 'source_order_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 1. coupons 테이블에서 '재방문 쿠폰' 조회
    const { data: couponData, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('coupon_type', 'revisit')
      .single();

    if (couponError || !couponData) {
      console.error('쿠폰 조회 실패:', couponError);
      return new Response(
        JSON.stringify({ error: '재구매 쿠폰을 찾을 수 없습니다' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 2. 중복 발급 체크: 같은 주문으로 이미 발급받았는지 확인
    const { data: existingCoupon, error: checkError } = await supabaseClient
      .from('user_coupons')
      .select('id')
      .eq('user_id', user_id)
      .eq('coupon_id', couponData.id)
      .eq('source_order_id', source_order_id)
      .maybeSingle();

    if (checkError) {
      console.error('쿠폰 중복 체크 실패:', checkError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급 확인에 실패했습니다' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 3. 이미 발급된 경우
    if (existingCoupon) {
      console.log(`이미 발급된 쿠폰: user_id=${user_id}, source_order_id=${source_order_id}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: '이 주문에 대한 쿠폰이 이미 발급되었습니다',
          alreadyIssued: true 
        }),
        { 
          status: 409, // 409 Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ⭐ 4. 새로 발급 (source_order_id 포함)
    const { data: userCoupon, error: insertError } = await supabaseClient
      .from('user_coupons')
      .insert({
        user_id: user_id,
        coupon_id: couponData.id,
        source_order_id: source_order_id, // ⭐ 추가!
        is_used: false,
        expired_at: null, // 유효기간 없음
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('쿠폰 발급 실패:', insertError);
      return new Response(
        JSON.stringify({ error: '쿠폰 발급에 실패했습니다' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ 재구매 쿠폰 발급 완료:', userCoupon);

    return new Response(
      JSON.stringify({ 
        success: true, 
        coupon: userCoupon,
        message: '쿠폰이 발급되었습니다'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

---

## 🎯 주요 변경 사항

### 1. 파라미터 추가
```typescript
// 기존
const { user_id } = await req.json()

// 변경 후
const { user_id, source_order_id } = await req.json()
```

### 2. source_order_id 필수 체크
```typescript
if (!source_order_id) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: 'source_order_id가 필요합니다' 
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 3. 중복 발급 체크
```typescript
const { data: existingCoupon } = await supabase
  .from('user_coupons')
  .select('id')
  .eq('user_id', user_id)
  .eq('coupon_id', coupon_id)
  .eq('source_order_id', source_order_id)  // ⭐ 추가
  .maybeSingle()

if (existingCoupon) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: '이 주문에 대한 쿠폰이 이미 발급되었습니다',
      alreadyIssued: true 
    }),
    { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

### 4. 쿠폰 발급 시 source_order_id 저장
```typescript
const { data: newCoupon } = await supabase
  .from('user_coupons')
  .insert({
    user_id,
    coupon_id,
    source_order_id, // ⭐ 추가!
    is_used: false,
    expired_at: expiryDate.toISOString(),
  })
  .select()
  .single()
```

---

## 📋 업데이트 절차

### Supabase Dashboard에서:

1. **Edge Functions** 메뉴 이동
2. **`issue-revisit-coupon`** 함수 선택
3. **Edit** 버튼 클릭
4. 위 코드 전체 복사 → 붙여넣기
5. **Deploy** 버튼 클릭
6. ✅ 배포 완료!

---

## 🧪 테스트 방법

### 1. 정상 발급 테스트
```
1. 유료 콘텐츠 구매 완료
2. 풀이 마지막 페이지(10/10)까지 이동
3. "다음" 버튼 클릭
4. `/result/complete` 페이지에서 쿠폰 카드 클릭
5. ✅ 토스트: "쿠폰이 발급되었습니다"
```

### 2. 중복 발급 방지 테스트
```
1. 구매내역에서 같은 상품 "운세 보기" 클릭
2. 풀이 마지막 페이지(10/10)까지 이동
3. "다음" 버튼 클릭
4. `/result/complete` 페이지 이동
5. ✅ 쿠폰 카드에 "발급 완료" 표시 (중복 발급 안 됨)
```

### 3. 브라우저 콘솔 로그 확인
```javascript
// 정상 발급
🎟️ 재구매 쿠폰 발급 시작: { userId: '...', orderId: '...' }
✅ 쿠폰 발급 성공: { success: true, ... }

// 중복 발급 시도
🎟️ 재구매 쿠폰 발급 시작: { userId: '...', orderId: '...' }
❌ 쿠폰 발급 실패: { message: '이 주문에 대한 쿠폰이 이미 발급되었습니다' }
```

---

## 📊 DB 확인 쿼리

```sql
-- 발급된 쿠폰 확인
SELECT 
  uc.id,
  uc.user_id,
  uc.source_order_id,
  uc.is_used,
  uc.issued_at,
  c.name AS coupon_name,
  o.gname AS order_product_name
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
LEFT JOIN orders o ON uc.source_order_id = o.id
WHERE c.name = '재방문 쿠폰'
ORDER BY uc.issued_at DESC
LIMIT 10;
```

---

**문서 끝**
