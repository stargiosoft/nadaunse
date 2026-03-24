# 🎟️ 재구매 쿠폰 수동 발급으로 변경

> **작성일**: 2024-12-17  
> **목적**: 쿠폰 자동 발급 → 클릭 시 수동 발급으로 변경  
> **업데이트**: 페이지 로드 시 발급 여부 체크 추가 ⭐

---

## 📝 변경 사항

### **Before (자동 발급)** ❌
- 페이지 로드 시 자동으로 쿠폰 발급 시작
- 사용자 개입 없이 바로 발급 완료
- 로딩 스피너가 자동으로 보임

### **After (수동 발급 + 발급 여부 체크)** ✅
- **페이지 로드 시**: 해당 주문으로 쿠폰이 이미 발급되었는지 체크
- **이미 발급됨**: "발급 완료" 상태로 자동 표시 (클릭 불가)
- **미발급**: 다운로드 아이콘 표시 (클릭 시 발급)

---

## 🔧 수정된 코드

### **파일**: `/components/ResultCompletePage.tsx`

#### 1. 새로운 상태 추가
```typescript
const [isCheckingCoupon, setIsCheckingCoupon] = useState(true); // 쿠폰 체크 중 상태
```

#### 2. useEffect 수정
```typescript
// Before
useEffect(() => {
  fetchRecommendedContents();  // 추천 콘텐츠만 조회
}, []);

// After
useEffect(() => {
  const initializePage = async () => {
    await Promise.all([
      checkCouponIssued(),        // ⭐ 쿠폰 발급 여부 체크
      fetchRecommendedContents()
    ]);
  };

  initializePage();
}, []);
```

#### 3. checkCouponIssued 함수 추가
```typescript
/**
 * ⭐ 해당 주문으로 이미 쿠폰이 발급되었는지 체크
 */
const checkCouponIssued = async () => {
  setIsCheckingCoupon(true);
  try {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    // 로그아웃 사용자는 체크 불필요
    if (!user?.id) {
      console.log('🔍 로그아웃 사용자 - 쿠폰 체크 스킵');
      setIsCheckingCoupon(false);
      return;
    }

    const orderId = location.state?.orderId;
    if (!orderId) {
      console.log('🔍 orderId 없음 - 쿠폰 체크 스킵');
      setIsCheckingCoupon(false);
      return;
    }

    console.log('🔍 쿠폰 발급 여부 체크 시작:', { userId: user.id, orderId });

    // 1. 재방문 쿠폰 ID 조회
    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .select('id')
      .eq('coupon_type', 'revisit')
      .single();

    if (couponError || !couponData) {
      console.error('❌ 쿠폰 조회 실패:', couponError);
      setIsCheckingCoupon(false);
      return;
    }

    // 2. 이미 발급받았는지 확인
    const { data: existingCoupon, error: checkError } = await supabase
      .from('user_coupons')
      .select('id, issued_at')
      .eq('user_id', user.id)
      .eq('coupon_id', couponData.id)
      .eq('source_order_id', orderId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ 쿠폰 발급 여부 체크 실패:', checkError);
      setIsCheckingCoupon(false);
      return;
    }

    if (existingCoupon) {
      console.log('✅ 이미 발급된 쿠폰:', existingCoupon);
      setIsCouponIssued(true);  // ⭐ 발급 완료 상태로 설정
    } else {
      console.log('📋 발급 가능한 쿠폰');
      setIsCouponIssued(false);
    }
  } catch (error) {
    console.error('❌ 쿠폰 체크 중 오류:', error);
  } finally {
    setIsCheckingCoupon(false);
  }
};
```

---

## 🎨 UI 변경 사항

### **쿠폰 카드 상태별 UI**

| 상태 | 아이콘 | 텍스트 색상 | 배경색 | 클릭 가능 |
|------|--------|-------------|---------| ----------|
| **체크 중** | 🔄 로딩 스피너 | `#151515` (검은색) | `#f9f9f9` | ❌ No |
| **발급 전** | 📥 Download | `#151515` (검은색) | `#f9f9f9` | ✅ Yes |
| **발급 중** | 🔄 로딩 스피너 | `#151515` (검은색) | `#f9f9f9` | ❌ No |
| **발급 완료** | "발급<br/>완료" | `#848484` (회색) | `#f3f3f3` | ❌ No |

---

## 🧪 테스트 시나리오

### 시나리오 1: 첫 결제 완료 (미발급)
1. 유료 콘텐츠 완료 후 `/result/complete` 페이지 이동
2. **쿠폰 카드에 다운로드 아이콘 표시**
3. 브라우저 콘솔: `📋 발급 가능한 쿠폰`
4. 쿠폰 카드 클릭
5. 로딩 스피너 표시
6. **✅ "쿠폰이 발급되었습니다" 토스트 표시**
7. 쿠폰 카드 상태 "발급 완료"로 변경

### 시나리오 2: 같은 주문 재방문 (이미 발급됨) ⭐
1. 이미 쿠폰을 발급받은 주문의 완료 페이지 접속
2. **페이지 로드 시 자동으로 "발급 완료" 상태로 표시**
3. 브라우저 콘솔: `✅ 이미 발급된 쿠폰: { id: '...', issued_at: '...' }`
4. 쿠폰 카드 클릭 불가 (cursor-not-allowed)
5. **토스트 표시 안 됨** (이미 발급됨)

### 시나리오 3: 로그아웃 사용자
1. 로그아웃 상태로 `/result/complete` 페이지 접속
2. 브라우저 콘솔: `🔍 로그아웃 사용자 - 쿠폰 체크 스킵`
3. 쿠폰 카드에 다운로드 아이콘 표시
4. 쿠폰 카드 클릭
5. **❌ Alert: "로그인이 필요한 서비스입니다"**

### 시나리오 4: orderId 없는 경우
1. `location.state`에 `orderId` 없이 페이지 접속
2. 브라우저 콘솔: `🔍 orderId 없음 - 쿠폰 체크 스킵`
3. 쿠폰 카드에 다운로드 아이콘 표시
4. 쿠폰 카드 클릭
5. **❌ Alert: "주문 정보를 찾을 수 없습니다"**

---

## 📊 브라우저 콘솔 로그

### 첫 방문 (미발급)
```javascript
// 1. 페이지 로드
🔍 쿠폰 발급 여부 체크 시작: { userId: '...', orderId: '...' }
📋 발급 가능한 쿠폰
✅ 추천 콘텐츠 조회 성공: 20 개

// 2. 쿠폰 카드 클릭
🎟️ 재구매 쿠폰 발급 시작: { userId: '...', orderId: '...' }
POST .../issue-revisit-coupon 200 (OK)
✅ 쿠폰 발급 성공: { success: true, ... }
```

### 재방문 (이미 발급됨) ⭐
```javascript
// 1. 페이지 로드
🔍 쿠폰 발급 여부 체크 시작: { userId: '...', orderId: '...' }
✅ 이미 발급된 쿠폰: { id: '...', issued_at: '2024-12-17T...' }
✅ 추천 콘텐츠 조회 성공: 20 개

// 2. 쿠폰 카드 클릭 불가 (발급 완료 상태)
```

---

## 🔄 UX 플로우

### **첫 방문 (미발급)**
```
[유료 콘텐츠 완료]
        ↓
[/result/complete 페이지 이동]
        ↓
[쿠폰 발급 여부 체크]
        ↓
    [미발급]
        ↓
[쿠폰 카드 표시 (다운로드 아이콘)]
        ↓
    [사용자 클릭]
        ↓
  [로딩 스피너 표시]
        ↓
 [Edge Function 호출]
        ↓
   [발급 성공]
        ↓
   [토스트 표시]
        ↓
["발급 완료" 표시]
```

### **재방문 (이미 발급됨)** ⭐
```
[유료 콘텐츠 완료]
        ↓
[/result/complete 페이지 이동]
        ↓
[쿠폰 발급 여부 체크]
        ↓
   [이미 발급됨]
        ↓
[쿠폰 카드 "발급 완료" 상태로 표시]
        ↓
   [클릭 불가]
```

---

## 🎯 핵심 변경 포인트

1. **자동 → 수동**: 페이지 로드 시 자동 발급 제거
2. **발급 여부 체크**: 페이지 로드 시 이미 발급되었는지 확인
3. **조건부 표시**: 발급됨 → "발급 완료", 미발급 → 다운로드 아이콘
4. **명시적 UX**: 사용자가 쿠폰 카드를 클릭해야 발급
5. **중복 방지**: 같은 주문으로 재방문 시 클릭 불가

---

## ⚡ 성능 개선

### Before (자동 발급)
```javascript
// 페이지 로드 시 1개 API 호출
- fetchRecommendedContents()

// 사용자가 클릭 시 추가 호출
- handleIssueCoupon()
```

### After (발급 여부 체크 + 수동 발급)
```javascript
// 페이지 로드 시 2개 API 동시 호출
- checkCouponIssued()        // ⭐ 쿠폰 발급 여부 체크
- fetchRecommendedContents()

// 사용자가 클릭 시 (미발급인 경우만)
- handleIssueCoupon()
```

**장점**:
- 중복 발급 방지
- UX 개선 (이미 발급된 경우 바로 "발급 완료" 표시)
- 사용자 의도 반영 (명시적 동의)

---

## 📚 관련 파일

- **수정된 파일**: `/components/ResultCompletePage.tsx`
- **Edge Function**: `/supabase/functions/issue-revisit-coupon/index.ts`
- **마이그레이션**: `/docs/COUPON_SOURCE_ORDER_MIGRATION.md`
- **배포 가이드**: `/docs/DEPLOYMENT_CHECK.md`

---

**✅ 변경 완료! 이제 쿠폰은 클릭 시에만 발급되며, 이미 발급받은 경우 "발급 완료" 상태로 표시됩니다.**
