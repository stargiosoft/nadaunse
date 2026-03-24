# ✅ 배포 체크리스트

## 📝 완료된 작업

### 1. ✅ 프론트엔드 수정 완료
**파일**: 
- `/components/MasterContentDetailPage.tsx` - 쿠폰 기반 가격 노출 로직
- `/components/ResultCompletePage.tsx` - source_order_id 전달
- `/supabase/functions/issue-revisit-coupon/index.ts` - Edge Function 중복 발급 방지

### 2. ✅ DB 마이그레이션 완료
```sql
ALTER TABLE user_coupons ADD COLUMN source_order_id uuid REFERENCES orders(id);
CREATE INDEX idx_user_coupons_source_order ON user_coupons(user_id, coupon_id, source_order_id);
```

---

## 🚀 남은 작업: Edge Function 배포

**⚠️ 중요**: Edge Function을 배포하지 않으면 400 에러가 발생합니다!

### 현재 상태
- ❌ **Edge Function이 배포되지 않음** → 400 Bad Request
- ✅ 로컬 파일은 수정 완료 (`/supabase/functions/issue-revisit-coupon/index.ts`)

---

## 📋 배포 방법

### 옵션 1: Supabase CLI (권장) 🖥️

```bash
# 1. Supabase CLI 로그인
supabase login

# 2. 프로젝트와 연결 확인
supabase link

# 3. Edge Function 배포
supabase functions deploy issue-revisit-coupon

# 4. 배포 확인
supabase functions list
```

### 옵션 2: Supabase Dashboard (수동) 🌐

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택: `hyltbeewxaqashyivilu`

2. **Edge Functions 메뉴**
   - 왼쪽 사이드바 → **"Edge Functions"** 클릭

3. **issue-revisit-coupon 함수 선택**
   - 목록에서 `issue-revisit-coupon` 찾기
   - 클릭해서 열기

4. **코드 수정**
   - **"Edit"** 또는 **"Code"** 버튼 클릭
   - `/supabase/functions/issue-revisit-coupon/index.ts` 파일 내용 전체 복사
   - 에디터에 붙여넣기
   - **전체 코드를 덮어쓰기**

5. **저장 & 배포**
   - **"Save"** 버튼 클릭
   - **"Deploy"** 버튼 클릭
   - 배포 완료 확인 (보통 1-2분 소요)

---

## 🧪 배포 후 테스트

### 1. 브라우저 콘솔 확인

```javascript
// 성공 케이스
🎟️ 재구매 쿠폰 자동 발급 시작: { userId: '...', orderId: '...' }
✅ 쿠폰 발급 성공: { success: true, ... }

// 중복 발급 방지
🎟️ 재구매 쿠폰 자동 발급 시작: { userId: '...', orderId: '...' }
❌ 쿠폰 발급 실패: { message: '이 주문에 대한 쿠폰이 이미 발급되었습니다' }
```

### 2. 400 에러 해결 확인

#### 배포 전 (❌)
```
POST https://...supabase.co/functions/v1/issue-revisit-coupon 400 (Bad Request)
❌ 쿠폰 발급 실패: FunctionsHttpError: Edge Function returned a non-2xx status code
```

#### 배포 후 (✅)
```
POST https://...supabase.co/functions/v1/issue-revisit-coupon 200 (OK)
✅ 쿠폰 발급 성공: { success: true, ... }
```

---

## 📊 DB 확인

### 쿠폰 발급 확인
```sql
SELECT 
  uc.id,
  uc.user_id,
  uc.source_order_id,
  uc.is_used,
  uc.issued_at,
  c.name AS coupon_name,
  o.gname AS order_product
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
LEFT JOIN orders o ON uc.source_order_id = o.id
WHERE uc.source_order_id IS NOT NULL
ORDER BY uc.issued_at DESC
LIMIT 10;
```

### 중복 발급 체크
```sql
-- 같은 주문으로 2번 이상 발급된 경우 확인 (비어있어야 정상)
SELECT 
  source_order_id,
  user_id,
  COUNT(*) as duplicate_count
FROM user_coupons
WHERE source_order_id IS NOT NULL
GROUP BY source_order_id, user_id
HAVING COUNT(*) > 1;
```

---

## 🎯 전체 플로우 테스트

### 시나리오 1: 첫 결제 완료
1. 유료 콘텐츠 결제 완료
2. 콘텐츠 10/10 페이지 완료
3. "다음" 버튼 클릭
4. `/result/complete` 페이지 자동 이동
5. **✅ 쿠폰 카드 클릭해서 발급** (토스트 표시)
6. 브라우저 콘솔: `✅ 쿠폰 발급 성공`

### 시나리오 2: 같은 주문 재방문
1. 구매내역 페이지 접속
2. 같은 상품 "운세 보기" 클릭
3. 콘텐츠 10/10 페이지 완료
4. "다음" 버튼 클릭
5. `/result/complete` 페이지 자동 이동
6. **✅ 쿠폰 카드 "발급 완료" 표시** (중복 발급 안 됨)
7. 브라우저 콘솔: `✅ 이미 발급된 쿠폰`

### 시나리오 3: 상품 상세 페이지 (로그아웃)
1. 로그아웃 상태로 상품 상세 페이지 접속
2. **✅ 혜택가 7,900원** (첫 구매 혜택가) 표시
3. **✅ "첫 구매 쿠폰 받고 7,900원으로 풀이 보기"** 버튼 표시
4. 버튼 클릭 → `/login/new` 로그인 페이지 이동

### 시나리오 4: 상품 상세 페이지 (가입축하쿠폰 보유)
1. 로그인 상태 + 가입축하쿠폰 보유
2. 상품 상세 페이지 접속
3. **✅ 혜택가 7,900원** (첫 구매 혜택가) 표시
4. 브라우저 콘솔: `🎟️ [쿠폰 조회] 사용 가능한 쿠폰: 1 개`
5. 버튼 클릭 → `/master/content/detail/{id}/payment` 결제 페이지 이동

### 시나리오 5: 상품 상세 페이지 (재방문쿠폰만 보유)
1. 로그인 상태 + 재방문쿠폰만 보유 (가입축하쿠폰 이미 사용)
2. 상품 상세 페이지 접속
3. **✅ 혜택가 9,900원** (재구매 혜택가) 표시
4. **✅ "재구매 쿠폰 받고 9,900원으로 풀이 보기"** 버튼 표시

---

## 🔧 트러블슈팅

### 문제 1: 여전히 400 에러 발생
**원인**: Edge Function이 제대로 배포되지 않음

**해결**:
1. Supabase Dashboard → Edge Functions → issue-revisit-coupon
2. "Logs" 탭에서 에러 확인
3. 코드 재배포
4. 브라우저 캐시 삭제 (Ctrl + Shift + R)

### 문제 2: source_order_id is required 에러
**원인**: 프론트엔드에서 orderId를 전달하지 않음

**해결**:
1. ResultCompletePage 접속 시 URL 확인: `/result/complete?orderId=xxx`
2. 브라우저 콘솔에서 `location.state` 확인
3. orderId가 없으면 이전 페이지에서 전달 로직 확인

### 문제 3: 쿠폰명이 다름
**원인**: DB에 저장된 쿠폰명이 '재방문 쿠폰'이 아님

**해결**:
```sql
-- 쿠폰명 확인
SELECT * FROM coupons WHERE coupon_type = 'revisit';

-- 필요시 쿠폰명 업데이트
UPDATE coupons SET name = '재방문 쿠폰' WHERE coupon_type = 'revisit';
```

---

## 📚 관련 문서

- **Edge Function 코드**: `/supabase/functions/issue-revisit-coupon/index.ts`
- **프론트엔드**: `/components/ResultCompletePage.tsx`
- **마이그레이션 가이드**: `/docs/COUPON_SOURCE_ORDER_MIGRATION.md`
- **배포 가이드**: `/docs/EDGE_FUNCTION_UPDATE_GUIDE.md`
- **구현 문서**: `/docs/COUPON_PRICE_DISPLAY_IMPLEMENTATION.md`

---

**✅ 모든 체크리스트 완료 후 운영 배포 가능!**
