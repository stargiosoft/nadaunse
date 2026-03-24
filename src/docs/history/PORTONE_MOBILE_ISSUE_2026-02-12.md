# PortOne 모바일 결제 장애 기록 (2026-02-12)

> **상태**: ✅ **해결 완료** (2026-02-12) - PortOne SDK 이슈가 아닌 CSP 도메인 누락이 원인이었음

---

## 요약

~~2026-02-12부터 모바일에서 모든 결제 수단이 작동하지 않음. PortOne SDK 자체 이슈로 확정.~~

**실제 원인**: 2026-01-21 CSP 보안 강화 시 결제 도메인 2개 누락으로 인한 **약 3주간 결제 장애**.
- **다날 카드**: `checkout.teledit.com`이 CSP `frame-src`에 없어서 iframe 차단 (PC/모바일)
- **카카오페이 모바일**: `*.kakaopay.com`이 CSP `form-action`에 없어서 redirect 차단
- 순수 HTML 테스트 페이지에서도 동일 증상이었던 이유: 같은 Vercel CSP 헤더를 받았기 때문

---

## 타임라인

| 시간 | 내용 |
|------|------|
| 2/11 13:10 | 카카오페이 마지막 성공 결제 |
| 2/11 13:44 | 카드(다날) 마지막 성공 결제 |
| 2/12 오전 | 모바일 결제 전면 실패 시작 |
| 2/12 15:05 | 포트원 기술 문의 메일 발송 |
| 2/12 15:08 | 포트원 Matt 답변 (거래번호/영상 요청) |
| 2/12 15:36 | 상세 답장 발송 (거래번호, 테스트 페이지 URL, SDK 격리 테스트 결과 포함) |

---

## 증상

### 모바일 (iOS Safari, Android Chrome)
- 카카오페이: 결제 요청 후 아무 반응 없음 (결제창 미표시)
- 신용카드(다날): 결제 요청 후 흰색 빈 화면 또는 아무 반응 없음
- PortOne 관리자에서 확인 시: 거래 생성됨, 실패 사유 `[결제포기] 사용자가 결제를 취소하셨습니다`
  - 즉, SDK가 결제창을 만들었으나 사용자가 보거나 상호작용할 수 없었음

### PC (Chrome, Safari)
- 카카오페이: 정상 (QR 코드 표시)
- 신용카드(다날): 정상 (iframe 결제창 표시)

---

## 실패한 거래 정보

| PortOne 거래번호 | merchant_uid | PG사 | 실패 사유 |
|-----------------|--------------|------|----------|
| `imp_044833906813` | `order_1770873833559` | - | [결제포기] 사용자가 결제를 취소하셨습니다 |
| `imp_287631553307` | `order_1770866631212` | - | [결제포기] 사용자가 결제를 취소하셨습니다 |

- 가맹점 식별코드: `imp38022226`
- PG: `kakaopay.CAAHYG5DKD`, `danal_tpay.A010076393`

---

## SDK 격리 테스트 (핵심 증거)

React/PaymentNew.tsx 코드를 **완전히 우회**하는 순수 HTML 테스트 페이지 작성:

- **파일**: `/public/payment-test.html`
- **URL**: `https://staging.nadaunse.com/payment-test.html`
- **내용**: PortOne SDK만 로드하고 `IMP.request_pay` 직접 호출
- **결과**: 모바일에서 동일하게 결제 불가 → **우리 코드 문제 아님, SDK 자체 이슈 확정**

```html
<script src="https://cdn.iamport.kr/v1/iamport.js"></script>
<script>
  IMP.init('imp38022226');
  IMP.request_pay({
    pg: 'danal_tpay.A010076393',
    pay_method: 'card',
    merchant_uid: 'test_' + Date.now(),
    name: '테스트',
    amount: 100,
    m_redirect_url: window.location.href
  }, function(response) { console.log(response); });
</script>
```

---

## 시도한 코드 수정 (5회, 모두 실패)

포트원 SDK 이슈로 확정되기 전에 우리 코드 쪽에서 시도한 수정들:

| # | 커밋 | 수정 내용 | 결과 |
|---|------|----------|------|
| 1 | `5c5592f3` | 카카오페이만 popup 제거, 커스텀 타임아웃 | 실패 |
| 2 | `0b7ac52c` | 작동하던 태그(v2026.01.21-보안완성)와 동일하게 복원 | 실패 |
| 3 | `781065fa` | 카카오페이 redirect 모드 전환 | 실패 |
| 4 | `49df7f9a` | popup:false 전체 복원 + 2초 안전 타임아웃 | 실패 (카드: 흰화면, 카카오페이: 반응없음) |
| 5 | `0a76772d` | 모바일/PC 분기 (모바일: redirect, PC: iframe) | 실패 |
| 6 | `e94d5db8` | SDK 격리 테스트 페이지 추가 | 테스트 페이지에서도 실패 → SDK 이슈 확정 |

모든 커밋은 `staging` 브랜치에 있음.

---

## SDK 정보

- **SDK URL**: `https://cdn.iamport.kr/v1/iamport.js` (버전 고정 안 됨)
- **현재 SDK 버전**: 3.43.0
- **문제**: unversioned CDN URL이라 포트원이 SDK를 업데이트하면 자동으로 반영됨
- **의심**: 2/11~2/12 사이에 SDK 업데이트가 있었을 가능성

### 레거시 SDK URL (버전 고정 가능)
```
https://cdn.iamport.kr/js/iamport.payment-1.2.0.js
```
포트원 답변 후 SDK 버전 고정 검토 필요.

---

## 관련 코드 파일

| 파일 | 역할 |
|------|------|
| `src/components/PaymentNew.tsx` | 결제 메인 컴포넌트 (~1700줄) |
| `src/App.tsx` (line 2938) | PortOne SDK 동적 로드 |
| `src/App.tsx` (line 706-800) | PaymentNewPage 래퍼 (useLoginRequired, location.key 체크) |
| `vercel.json` | CSP 헤더 (frame-src에 결제 도메인 포함) |
| `public/payment-test.html` | SDK 격리 테스트 페이지 |

---

## PaymentNew.tsx 현재 상태 (커밋 e94d5db8)

### 핵심 로직
1. **popup 파라미터**: PC에서만 `popup: false` 설정, 모바일은 미설정 (SDK 자동 감지)
2. **overlay watch**: PC에서만 iframe 감지 (500ms 간격, 5초 안전 타임아웃)
3. **로딩 오버레이**: `isProcessingPayment` 상태로 `z-50` PageLoader 표시
4. **이벤트 핸들러**: popstate, pageshow, visibilitychange - 5초 grace period

### 작동하던 코드 (v2026.01.21-보안완성 태그)
- `popup: false` 모든 결제 수단에 적용
- overlay watch 모든 결제 수단에 적용
- 이 코드도 현재 모바일에서 작동하지 않음 (SDK 이슈이므로)

---

## 해결 (2026-02-12)

### 근본 원인: CSP 도메인 누락

PortOne SDK 이슈가 아니라 **2026-01-21 CSP 보안 강화 시 결제 도메인 2개 누락**이 원인이었음.

| 결제 수단 | 누락 도메인 | CSP 지시문 | 수정 커밋 |
|-----------|------------|-----------|----------|
| 다날 카드 (PC/모바일) | `*.teledit.com` | `frame-src` | `058757a6` |
| 카카오페이 (모바일) | `*.kakaopay.com` | `form-action` | `59ab20e2` |

### 오진 경위
- 순수 HTML 테스트 페이지에서도 동일 증상 → "SDK 이슈 확정"으로 판단
- 실제로는 테스트 페이지도 동일 Vercel CSP 헤더를 받으므로 당연히 같은 증상
- **브라우저 콘솔의 CSP 에러 메시지를 처음부터 확인했으면 즉시 해결 가능했음**

### 후속 조치
- [x] `vercel.json` CSP 수정 및 프로덕션 배포
- [x] `DECISIONS.md` 장애 기록 추가
- [x] `★SECURITY★.md` CSP 정책 현행화
- [ ] 포트원 Matt에게 해결 안내 메일 발송 (CSP 문제였음을 알림)
- [ ] `payment-test.html` 삭제 (더 이상 필요 없음)
- [ ] staging 디버깅 커밋 6개 정리 검토

---

## 참고: 포트원 연락처

- **담당자**: 김형주 Matt (Engineering | Software Engineer)
- **이메일**: matt@portone.io
- **주소**: 서울시 성동구 성수이로 20길 16 JK타워 3층
- **웹사이트**: https://www.portone.io

---

**최종 업데이트**: 2026-02-12 (해결 완료 - CSP 도메인 누락이 원인)
