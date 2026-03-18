# 나다운세 디자인 시스템 (Design System)

> **이 문서는 나다운세 프로젝트의 디자인 시스템 정의서입니다.**
> 새 페이지/컴포넌트 개발 시 반드시 참고하세요.

---

## 1. 디자인 토큰 (Design Tokens)

### 1.1 색상 (Colors)

#### 브랜드

| 이름 | 값 | 용도 |
|------|-----|------|
| **Primary** | `#48b2af` | CTA 버튼, 확인 버튼, 브랜드 강조 |
| **Primary Dark** | `#41a09e` | 태그(심화), 강조 텍스트 |
| **Primary Pressed** | `#389998` | CTA 버튼 pressed 상태 |
| **Primary Light** | `#f0f8f8` | 심화 태그 배경, 보조 버튼 배경 |
| **Primary Tint** | `#E4F7F7` | 에러 아이콘 배경, 장식 |
| **Primary Surface** | `#f7fafa` | 블로그 h2 배경, 크로스링크 배경 |

#### 텍스트

| 이름 | 값 | 용도 |
|------|-----|------|
| **Text Primary** | `#151515` | 기본 텍스트, 제목 |
| **Text Black** | `#000000` | 네비게이션 버튼 텍스트 |
| **Text Secondary** | `#525252` | 다이얼로그 취소 버튼 텍스트 |
| **Text Tertiary** | `#6d6d6d` | 본문 서브 텍스트 |
| **Text Caption** | `#848484` | 라벨, 설명, 뒤로가기 아이콘 |
| **Text Disabled** | `#b7b7b7` | 플레이스홀더, 비활성화 텍스트 |
| **Text Read** | `#999999` | "읽어봄" 태그 |
| **Text White** | `#ffffff` | CTA 버튼 텍스트, 다크 토스트 |

#### 배경/보더

| 이름 | 값 | 용도 |
|------|-----|------|
| **Surface** | `#ffffff` | 기본 배경 |
| **Surface Disabled** | `#f8f8f8` | 비활성화 버튼 배경 |
| **Surface Secondary** | `#f9f9f9` | 구분선, 카드 배경 |
| **Surface Tertiary** | `#f3f3f3` | 취소 버튼 배경, 구분선 |
| **Surface Input** | `#f3f3f5` | 입력 필드 배경 (CSS var: `--input-background`) |
| **Border Default** | `#e7e7e7` | 입력 필드 테두리, 구분선 |
| **Border Light** | `#e0e0e0` | 읽어봄 구분선 |
| **Border Divider** | `#f3f3f3` | BottomNavigation 상단 보더 |

#### 시맨틱

| 이름 | 값 | 용도 |
|------|-----|------|
| **New** | `#ef6878` | New 태그 텍스트 |
| **New BG** | `#fff6f7` | New 태그 배경 |
| **Free** | `#4590d6` | 무료 태그 텍스트 |
| **Free BG** | `#f0f8ff` | 무료 태그 배경 |
| **Info** | `#3B82F6` | 정보 토스트 아이콘 |
| **Destructive** | `#d4183d` | 삭제, 에러 (CSS var: `--destructive`) |
| **Kakao Yellow** | `#fee500` | 카카오 버튼 배경 |
| **Kakao Icon** | `#191919` | 카카오 아이콘 |
| **Overlay** | `rgba(0, 0, 0, 0.6)` | 다이얼로그 딤 배경 |
| **Overlay Light** | `rgba(0, 0, 0, 0.5)` | 바텀시트 딤 배경 (`bg-black/50`) |

#### CSS 변수 (globals.css)

```css
--background: #ffffff;
--primary: #030213;           /* shadcn 기본 텍스트 */
--primary-foreground: #ffffff;
--secondary: oklch(0.95 0.0058 264.53);
--muted: #ececf0;             /* shadcn 탭 배경 */
--muted-foreground: #717182;
--accent: #e9ebef;            /* 스켈레톤 배경 */
--destructive: #d4183d;
--border: rgba(0, 0, 0, 0.1);
--input-background: #f3f3f5;
```

---

### 1.2 타이포그래피 (Typography)

**폰트**: `Pretendard Variable, sans-serif` (모든 텍스트)

> **규칙**: Tailwind 폰트 클래스 (`text-*`, `font-*`, `leading-*`) 사용 금지 → **반드시 inline style** 사용

| 레벨 | Size | Weight | Line Height | Letter Spacing | Color | 용도 |
|------|------|--------|-------------|----------------|-------|------|
| **에러 타이틀** | 24px | 600 | 35.5px | -0.48px | `#000000` | ErrorPage 제목 |
| **대제목** | 22px | 600 | 32.5px | -0.22px | `#151515` | 섹션 대제목 |
| **헤더 타이틀** | 18px | 600 | 25.5px | -0.36px | `#000000` | NavigationHeader 제목 |
| **다이얼로그 타이틀** | 18px | 600 | 24px | -0.34px | `#151515` | ConfirmDialog 제목 |
| **에러 설명** | 16px | 400 | 28.5px | -0.32px | `#848484` | ErrorPage 설명 |
| **CTA 버튼** | 16px | 500 | 25px | -0.32px | `#ffffff` | 하단 고정 버튼 텍스트 |
| **본문** | 15px | 400 | 20px | -0.45px | `#6d6d6d` | 일반 본문, 입력 필드 |
| **다이얼로그 메시지** | 15px | 400 | 26px | -0.3px | `#848484` | ConfirmDialog 메시지 |
| **다이얼로그 버튼** | 15px | 500 | 20px | -0.45px | 상황별 | ConfirmDialog 버튼 |
| **네비 버튼** | 14px | 500 | 22px | -0.42px | `#000000` | BottomNavigation 이전/다음 |
| **토스트 (light)** | 14px | 500 | 20px | - | `#333333` | 라이트 토스트 메시지 |
| **페이지 번호** | 15px | 500/600 | 23.5px | -0.3px | `#151515`/`#b7b7b7` | BottomNavigation 번호 |
| **토스트 (dark)** | 13px | 400 | 20px | - | `#ffffff` | 다크 토스트 메시지 |
| **라벨** | 12px | 400 | 16px | -0.24px | `#848484` | 입력 필드 라벨 |
| **읽어봄 태그** | 11px | 400 | 16px | - | `#999999` | 콘텐츠 읽어봄 표시 |
| **콘텐츠 태그** | 10px | 600 | 15px | - | 상황별 | New, 심화, 무료 태그 |

**타이포그래피 사용 예시**:

```tsx
// ✅ 올바른 사용법 (inline style)
<p style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '20px',
  letterSpacing: '-0.45px',
  color: '#6d6d6d',
}}>
  본문 텍스트
</p>

// ❌ 금지 (globals.css base typography와 충돌)
<p className="text-sm font-bold leading-5">본문 텍스트</p>
```

---

### 1.3 간격 (Spacing)

| 값 | 주요 용도 |
|----|----------|
| `4px` | 아이콘 내부 패딩, 다이얼로그 제목-메시지 gap |
| `6px` | 태그 간 gap, 토스트 내부 gap (dark) |
| `8px` | 네비게이션 하단 여백, 버튼 px 패딩 |
| `10px` | 다이얼로그 버튼 gap, 네비 버튼 gap |
| `12px` | 콘텐츠 padding, CTA 컨테이너 padding, 토스트 py (light), 에러 제목-설명 gap |
| `16px` | 토스트 pl (light) |
| `20px` | 콘텐츠 좌우 padding, CTA 좌우 padding, 토스트 pr (light) |
| `28px` | 에러 아이콘-텍스트 gap, 다이얼로그 버튼 영역 px |
| `32px` | 다이얼로그 콘텐츠 px |
| `36px` | 다이얼로그 콘텐츠 pb |
| `40px` | 다이얼로그 콘텐츠 pt |

---

### 1.4 모서리 (Border Radius)

| 값 | 용도 |
|----|------|
| `4px` | 콘텐츠 태그 (New, 심화, 무료) |
| `8px` | 네비 목록 버튼, 스켈레톤 기본 (`rounded-md`) |
| `12px` | 뒤로가기 버튼, 아이콘 닫기 버튼, 네비 이전/다음 버튼 |
| `14px` | 사주 카드 이미지 |
| `16px` | CTA 버튼, 다이얼로그 버튼, 입력 필드, 아이콘 박스, 카카오 아이콘 |
| `24px` | 다이얼로그 컨테이너 |
| `9999px` | 토스트 (pill 형태) |

**CSS 변수 (shadcn)**:

```css
--radius: 0.625rem;           /* 10px */
--radius-sm: calc(--radius - 4px);   /* 6px */
--radius-md: calc(--radius - 2px);   /* 8px */
--radius-lg: var(--radius);          /* 10px */
--radius-xl: calc(--radius + 4px);   /* 14px */
```

---

### 1.5 그림자 (Shadows)

| 이름 | 값 | 용도 |
|------|-----|------|
| **CTA Fade** | `0px -8px 16px 0px rgba(255, 255, 255, 0.76)` | 하단 고정 버튼 상단 페이드 |
| **Toast** | Tailwind `shadow-lg` | 토스트 그림자 |

---

### 1.6 애니메이션 (Animations)

| 이름 | 지속시간 | Easing | 용도 |
|------|---------|--------|------|
| `toast-slide-up` | 240ms | ease-out | 토스트 등장 (아래→위 + scale 0.96→1) |
| `toast-slide-down` | 180ms | ease-in | 토스트 퇴출 |
| `fadeIn` | 200ms | ease-out | 바텀시트 오버레이 |
| `slideUp` | 300ms | ease-out | 바텀시트 시트 |
| `shimmer` | 1.5s | ease-in-out infinite | 스켈레톤 그라데이션 |
| `dotPulse` | - | scale + opacity | 로딩 점 |
| `fade-in` | 300ms | ease-out | 일반 페이드 인 |

**CSS 클래스**:

```css
.toast-animate-enter    /* 토스트 등장 */
.animate-fadeIn         /* 바텀시트 오버레이 */
.animate-slideUp        /* 바텀시트 시트 */
.animate-shimmer        /* 스켈레톤 shimmer */
.animate-fade-in        /* 일반 fade-in */
.btn-press              /* 버튼 누름 scale(0.995) */
```

**버튼 인터랙션**: `scale(0.99)` + `transition: transform 0.1s ease` (pointerDown/pointerLeave)

---

## 2. 레이아웃 (Layout)

### 2.1 페이지 기본 구조

- **최소 너비**: 360px (모바일)
- **최대 너비**: 440px (PC에서도 440px 중앙 정렬)

```tsx
// 표준 페이지 레이아웃 (스크롤 가능)
<div className="bg-white relative min-h-screen w-full flex justify-center">
  <div className="w-full max-w-[440px] relative pb-[140px]">
    {/* NavigationHeader */}
    {/* 네비 높이 여백 (60px) */}
    {/* 메인 콘텐츠 */}
    {/* 하단 고정 버튼 */}
  </div>
</div>
```

### 2.2 iOS Safari 바운스 방지 레이아웃

스크롤 바운스가 문제되는 페이지에서 사용:

```tsx
// iOS 바운스 제거 (fixed inset-0 패턴)
<div className="bg-white fixed inset-0 flex justify-center">
  <div className="w-full max-w-[440px] h-full flex flex-col bg-white">
    {/* shrink-0: 헤더 고정 */}
    <div className="h-[52px] shrink-0 ...">헤더</div>
    {/* flex-1 overflow-auto: 콘텐츠만 스크롤 */}
    <div className="flex-1 overflow-auto">콘텐츠</div>
    {/* shrink-0: 하단 버튼 고정 */}
    <div className="shrink-0">버튼</div>
  </div>
</div>
```

**참고**: `SajuSelectPage.tsx`, `FreeSajuSelectPage.tsx`, `ProfilePage.tsx`

---

## 3. 공통 컴포넌트 (Components)

### 3.1 NavigationHeader

> **파일**: `/components/NavigationHeader.tsx`

```tsx
import { NavigationHeader } from './NavigationHeader';

<NavigationHeader title="페이지 제목" onBack={() => navigate(-1)} />
```

| 속성 | 사양 |
|------|------|
| 높이 | 52px + 하단 여백 8px |
| 위치 | `fixed top-0 z-10`, 440px 제한, 중앙 정렬 |
| 뒤로가기 | 44x44px, radius 12px, 아이콘 24x24px (`#848484`) |
| 뒤로가기 active | `scale(0.9)`, `bg-gray-100` |
| 제목 | 18px/600, `#000000`, 중앙 정렬 |
| 우측 | 44px 빈 공간 (좌우 밸런스) |

**인라인 헤더 패턴** (NavigationHeader 미사용 시):

```tsx
<div className="bg-white h-[52px] shrink-0 w-full z-20">
  <div className="flex flex-col justify-center size-full">
    <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
      <ArrowLeft onClick={handleBack} />
      <p style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: '18px', fontWeight: 600, lineHeight: '25.5px', letterSpacing: '-0.36px', color: '#000000', textAlign: 'center' }}>
        페이지 제목
      </p>
      <div className="w-[44px]" />
    </div>
  </div>
</div>
```

---

### 3.2 ArrowLeft (뒤로가기 버튼)

> **파일**: `/components/ArrowLeft.tsx`

```tsx
import ArrowLeft from './ArrowLeft';
<ArrowLeft onClick={() => navigate(-1)} />
```

- 44x44px 터치 영역, 24x24px 아이콘
- 인터랙션: `group-active:scale-90`, `active:bg-gray-100`

---

### 3.3 하단 고정 CTA 버튼

모든 페이지의 하단 액션 버튼에 사용하는 공통 패턴:

```tsx
<div
  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
  style={{ boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)' }}
>
  <div style={{ padding: '12px 20px' }}>
    <button
      disabled={!isValid}
      className="w-full flex items-center justify-center"
      style={{
        height: '56px',
        borderRadius: '16px',
        backgroundColor: isValid ? '#48b2af' : '#f8f8f8',
        border: 'none',
        transition: 'all 0.15s ease',
      }}
      onPointerDown={e => { if (isValid) e.currentTarget.style.transform = 'scale(0.99)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
    >
      <span style={{
        fontFamily: 'Pretendard Variable, sans-serif',
        fontSize: '16px',
        fontWeight: 500,
        lineHeight: '25px',
        letterSpacing: '-0.32px',
        color: isValid ? '#ffffff' : '#b7b7b7',
      }}>
        다음
      </span>
    </button>
  </div>
</div>
```

| 속성 | 사양 |
|------|------|
| 컨테이너 | fixed bottom-0, 440px 제한, 중앙 정렬 |
| 그림자 | `0px -8px 16px 0px rgba(255, 255, 255, 0.76)` |
| 패딩 | `12px 20px` |
| 버튼 높이 | 56px |
| 버튼 radius | 16px |
| 활성 배경 | `#48b2af` (텍스트: `#ffffff`) |
| 비활성 배경 | `#f8f8f8` (텍스트: `#b7b7b7`) |
| pressed | `scale(0.99)`, 배경 `#41A09E` |

**2버튼 변형** (ErrorPage 패턴):

```tsx
<div className="flex gap-[12px] w-full">
  {/* 보조 버튼 */}
  <button style={{ backgroundColor: '#f0f8f8', borderRadius: '16px', height: '56px' }} className="flex-1">
    <span style={{ color: '#48b2af', fontSize: '16px', fontWeight: 500 }}>홈으로 가기</span>
  </button>
  {/* 주요 버튼 */}
  <button style={{ backgroundColor: '#48b2af', borderRadius: '16px', height: '56px' }} className="flex-1">
    <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 500 }}>다시 시도하기</span>
  </button>
</div>
```

---

### 3.4 BottomNavigation (결과 페이지 네비게이션)

> **파일**: `/components/BottomNavigation.tsx`

```tsx
import { BottomNavigation } from './BottomNavigation';

<BottomNavigation
  currentStep={3}
  totalSteps={8}
  onPrevious={handlePrev}
  onNext={handleNext}
  onToggleList={handleToggleList}
  disablePrevious={false}
  disableNext={false}
  nextLabel="다음"
/>
```

| 속성 | 사양 |
|------|------|
| 위치 | fixed bottom-0, 440px 제한, z-10 |
| 높이 | 68px |
| 상단 보더 | `1px solid #f3f3f3` |
| 좌측 | 목록 버튼 (36x36px, radius 8px) + 페이지 번호 (`00/00`) |
| 우측 | 이전/다음 버튼 (h-34px, radius 12px) |
| 구분선 | `h-12px, border-l 1px #e7e7e7` |
| 비활성 | `opacity-30` |
| active | `scale(0.95)`, `bg-gray-100` |

**HomeIndicatorLight** (iOS Safe Area):
- 높이 28px, 검은 막대 134px × 5px, radius 100px

---

### 3.5 ConfirmDialog (확인 다이얼로그)

> **파일**: `/components/ConfirmDialog.tsx`

```tsx
import { ConfirmDialog } from './ConfirmDialog';

<ConfirmDialog
  isOpen={isOpen}
  title="정말 삭제하시겠어요?"
  message="이 작업은 되돌릴 수 없습니다."
  confirmText="삭제"
  cancelText="취소"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
  confirmLoading={isLoading}
/>
```

| 속성 | 사양 |
|------|------|
| 오버레이 | `rgba(0, 0, 0, 0.6)`, 클릭 시 닫기 |
| 컨테이너 | 320px, radius 24px, border `1px solid #f3f3f3` |
| 콘텐츠 패딩 | `40px 32px 36px` |
| 제목 | 18px/600/24px, `#151515` |
| 메시지 | 15px/400/26px, `#848484` |
| 버튼 영역 | padding `0 28px 20px`, gap 10px |
| 버튼 높이 | 48px, radius 16px |
| 취소 버튼 | 배경 `#f3f3f3`, 텍스트 `#525252` |
| 확인 버튼 | 배경 `#48b2af`, 텍스트 `#ffffff` |
| 버튼 텍스트 | 15px/500/20px, spacing -0.45px |
| 로딩 | opacity 0.6, 텍스트 "처리 중..." |
| pressed | `scale(0.99)`, transition 0.1s ease |

**Props**:

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;          // default: '네'
  cancelText?: string;           // default: '아니요'
  confirmLoading?: boolean;      // default: false
}
```

---

### 3.6 Toast (토스트 알림)

> **파일**: `/components/ui/Toast.tsx`

```tsx
import { Toast } from './ui/Toast';

// 라이브러리: Sonner (sonner.tsx에서 Toaster 래핑)
// 호출: toast.custom(() => <Toast type="positive" message="저장 완료!" />)
```

#### Dark 변형 (기본)

| 속성 | 사양 |
|------|------|
| 배경 | `rgba(0, 0, 0, 0.40)` + `blur(24px)` |
| radius | 9999px (pill) |
| 패딩 | `6px 11px 6px 8px` |
| 아이콘 | 23x23px |
| gap | 6px |
| 메시지 | 13px/400/20px, `#ffffff` |
| 부제목 | 13px/400/18px, `rgba(255, 255, 255, 0.8)` |
| 애니메이션 | `toast-slide-up` 240ms / `toast-slide-down` 180ms |

#### Light 변형

| 속성 | 사양 |
|------|------|
| 배경 | `rgba(245, 243, 239, 0.95)` |
| radius | 9999px (pill) |
| 패딩 | `12px 20px 12px 16px` |
| 아이콘 | 32x32px |
| gap | 12px |
| 메시지 | 14px/500/20px, `#333333` |
| 부제목 | 13px/400/18px, `#666666` |

#### 타입별 아이콘

| 타입 | 아이콘 | 색상 |
|------|--------|------|
| `positive` | PositiveIcon (체크) | `#48B2AF` |
| `warning` | WarningIcon (삼각) | 노란색 |
| `negative` | NegativeIcon (X) | 빨간색 |
| `info` | InfoIcon (i) | `#3B82F6` |

---

### 3.7 바텀시트 (Bottom Sheet)

공통 패턴 (globals.css 애니메이션 사용):

| 속성 | 사양 |
|------|------|
| 렌더링 | `createPortal` (z-index: 9999) |
| 오버레이 | `bg-black/50`, `animate-fadeIn` (200ms) |
| 시트 | `animate-slideUp` (300ms) |
| 상태바 | `meta[name="theme-color"]` 변경 (딤: `#808080`) |
| body scroll | `document.body.style.overflow = 'hidden'` |
| Safe Area | `env(safe-area-inset-bottom)` 대응 |

**주요 바텀시트 컴포넌트**:

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `CouponBottomSheetNew` | `/components/CouponBottomSheetNew.tsx` | 쿠폰 선택 |
| `TableOfContentsBottomSheet` | `/components/TableOfContentsBottomSheet.tsx` | 목차 (드래그 핸들) |
| `RecordMePhoneBottomSheet` | `/components/RecordMePhoneBottomSheet.tsx` | 전화번호 입력 |

---

### 3.8 ContentTags (콘텐츠 태그)

> **파일**: `/components/ContentTags.tsx`

```tsx
import { ContentTags, isContentNew } from './ContentTags';

<ContentTags isPaid={true} isNew={isContentNew(content.created_at)} isRead={true} />
```

| 태그 | 배경 | 텍스트 색상 | 폰트 | padding | radius |
|------|------|-----------|------|---------|--------|
| **New** | `#fff6f7` | `#ef6878` | 10px/600 | `3px 3px` | 4px |
| **심화** | `#f0f8f8` | `#41a09e` | 10px/600 | `1px 4px` | 4px |
| **무료** | `#f0f8ff` | `#4590d6` | 10px/600 | `1px 4px` | 4px |
| **읽어봄** | - | `#999999` | 11px/400 | - | - |

- 태그 간 gap: 3px (New+심화/무료), 6px (태그행↔읽어봄)
- 읽어봄 구분선: `h-6px, border-l 1px #e0e0e0`
- New 판별: `isContentNew()` — 배포 7일 이내 (8일차부터 미노출)

---

### 3.9 입력 필드 (Input Field)

```tsx
// 표준 입력 필드
<div
  className="flex items-center w-full"
  style={{
    height: '56px',
    backgroundColor: '#ffffff',
    border: '1px solid #e7e7e7',
    borderRadius: '16px',
    padding: '0 12px',
  }}
>
  <input
    type="text"
    className="w-full outline-none bg-transparent"
    style={{
      fontFamily: 'Pretendard Variable, sans-serif',
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: '20px',
      letterSpacing: '-0.45px',
      color: '#151515',
    }}
    placeholder="플레이스홀더 텍스트"
  />
</div>
```

| 속성 | 사양 |
|------|------|
| 높이 | 56px |
| 배경 | `#ffffff` |
| 보더 | `1px solid #e7e7e7` |
| radius | 16px |
| padding | `0 12px` |
| 텍스트 | 15px/400, `#151515` |
| placeholder | `#B7B7B7` |

**라벨**: 12px/400/16px, `#848484`, spacing -0.24px

---

### 3.10 아이콘 버튼 (Icon Button)

```tsx
// 닫기 버튼 예시
<div
  onClick={onClose}
  className="group flex items-center justify-center cursor-pointer transition-colors duration-200 active:bg-gray-100"
  style={{ width: '44px', height: '44px', borderRadius: '12px' }}
>
  <X
    className="transition-transform duration-200 group-active:scale-90"
    style={{ width: '24px', height: '24px', color: '#848484' }}
    strokeWidth={1.8}
  />
</div>
```

| 속성 | 사양 |
|------|------|
| 터치 영역 | 44x44px |
| radius | 12px |
| 아이콘 | 24x24px, `#848484`, strokeWidth 1.8 |
| active | `bg-gray-100`, 아이콘 `scale(0.9)` |
| transition | 200ms |

---

### 3.11 아이콘 박스

```tsx
<div
  className="flex items-center justify-center shrink-0"
  style={{
    width: '44px',
    height: '44px',
    backgroundColor: '#fee500',
    borderRadius: '16px',
  }}
>
  <KakaoIcon />
</div>
```

---

### 3.12 ErrorPage (에러 페이지)

> **파일**: `/components/ErrorPage.tsx`

```tsx
import ErrorPage from './ErrorPage';

<ErrorPage type="404" />
```

| 타입 | 제목 | 버튼 |
|------|------|------|
| `404` | 페이지를 찾을 수 없어요 | 홈으로 가기 (1개) |
| `500` | 서버에 문제가 발생했어요 | 홈으로 + 다시 시도 (2개) |
| `503` | 서버가 과부하 상태예요 | 홈으로 + 다시 시도 (2개) |
| `network` | 인터넷 연결이 불안정해요 | 홈으로 + 다시 시도 (2개) |

| 속성 | 사양 |
|------|------|
| 레이아웃 | `min-h-screen min-h-[100dvh]`, 중앙 정렬 |
| 아이콘 | 76x76px, 배경 `#E4F7F7`, 아이콘 `#48B2AF` |
| 제목 | 24px/600/35.5px, `#000000` |
| 설명 | 16px/400/28.5px, `#848484` |
| 아이콘-텍스트 gap | 28px |
| 제목-설명 gap | 12px |
| 애니메이션 | Framer Motion stagger (0.1s 간격) |
| SEO | `noIndex: true` |

---

### 3.13 스켈레톤 (Skeleton)

> **파일**: `/components/ui/skeleton.tsx`, `/components/skeletons/*`

```tsx
import { Skeleton } from './ui/skeleton';

<Skeleton className="h-[200px] w-full rounded-[16px]" />
```

| 속성 | 사양 |
|------|------|
| 배경 | `bg-accent` (`#e9ebef`) |
| 애니메이션 | `animate-pulse` (기본), `animate-shimmer` (그라데이션) |
| radius | `rounded-md` (8px, 기본) |

**전용 스켈레톤 5종**:

| 컴포넌트 | 파일 | 용도 |
|----------|------|------|
| `HomeSkeleton` | `/components/skeletons/HomeSkeleton.tsx` | 홈 피드 |
| `ProfileSkeleton` | `/components/skeletons/ProfileSkeleton.tsx` | 프로필 (2변형) |
| `FreeContentDetailSkeleton` | `/components/skeletons/FreeContentDetailSkeleton.tsx` | 무료 상세 |
| `PaidContentDetailSkeleton` | `/components/skeletons/PaidContentDetailSkeleton.tsx` | 유료 상세 |
| `PaymentSkeleton` | `/components/skeletons/PaymentSkeleton.tsx` | 결제 페이지 |

---

### 3.14 shadcn/ui 컴포넌트 (48개)

> **경로**: `/components/ui/*`

프로젝트에서 사용하는 주요 shadcn/ui 컴포넌트:

| 컴포넌트 | 파일 | 주요 변형 |
|----------|------|----------|
| **Button** | `button.tsx` | `default / destructive / outline / secondary / ghost / link` × `default / sm / lg / icon` |
| **Card** | `card.tsx` | `Card > CardHeader > CardTitle/Description/Action + CardContent + CardFooter` |
| **Dialog** | `dialog.tsx` | Radix 기반, 닫기 버튼 포함 |
| **AlertDialog** | `alert-dialog.tsx` | Radix 기반, 접근성 지원 |
| **Tabs** | `tabs.tsx` | 배경 `#ececf0`, radius 12px |
| **Badge** | `badge.tsx` | `default / secondary / destructive / outline` |
| **Accordion** | `accordion.tsx` | 펼침/접힘 애니메이션 |
| **Input** | `input.tsx` | 배경 `#f3f3f5` |

---

## 4. Tailwind CSS v4 규칙

### 4.1 사용 금지 (globals.css base typography 충돌)

```tsx
// ❌ 절대 금지
className="text-sm"        // fontSize
className="text-lg"        // fontSize
className="text-[15px]"    // fontSize (arbitrary)
className="font-bold"      // fontWeight
className="font-[500]"     // fontWeight (arbitrary)
className="leading-5"      // lineHeight
className="leading-[20px]" // lineHeight (arbitrary)
```

### 4.2 반드시 inline style

```tsx
// ✅ 타이포그래피 — 무조건 inline style
style={{ fontSize: '15px', fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.45px', color: '#6d6d6d' }}

// ✅ 색상 — inline style
style={{ backgroundColor: '#fee500', color: '#151515', borderColor: '#e7e7e7' }}
```

### 4.3 Tailwind 사용 가능

```tsx
// ✅ 레이아웃
className="flex flex-col items-center justify-center"
className="w-full max-w-[440px] relative fixed"

// ✅ 간격 (토큰 기반 OK, arbitrary도 대부분 OK)
className="gap-4 p-4 m-4 px-5 py-3"
className="gap-[10px] px-[12px]"

// ✅ 기타 유틸리티
className="rounded-2xl overflow-hidden cursor-pointer"
className="transition-colors duration-200"
className="outline-none bg-transparent"
```

### 4.4 Arbitrary Value 주의

```tsx
// ⚠️ HEX 색상 arbitrary → 작동 안 할 수 있음 → inline style
className="bg-[#f0f8f8]"  // ❌ 불안정
style={{ backgroundColor: '#f0f8f8' }}  // ✅ 안전
```

---

## 5. iOS Safari 호환성

### 5.1 overflow + border-radius

```tsx
// ✅ 필수: transform-gpu 추가
<div className="overflow-hidden rounded-2xl transform-gpu">콘텐츠</div>

// ❌ iOS에서 잘릴 수 있음
<div className="overflow-hidden rounded-2xl">콘텐츠</div>
```

### 5.2 하단 CTA 첫 클릭 무반응

- Fixed 버튼에 `pointer-events-auto` 추가
- 스크롤 영역과 padding으로 분리

### 5.3 bfcache 결제 버튼 비활성화

```tsx
window.addEventListener('pageshow', (e) => {
  if (e.persisted) { /* 상태 리셋 */ }
});
```

### 5.4 모멘텀 스크롤

```tsx
<div className="overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
```

---

## 6. 이미지 & CSP

### 6.1 CSP 허용 도메인

```
img-src 'self' data: blob: https://*.supabase.co https://*.kakaocdn.net
```

### 6.2 규칙

- **외부 이미지 URL 사용 금지** (CSP 차단됨)
- `/public` 폴더에 저장 → 절대 경로 사용: `"/my-image.jpg"`
- 또는 Vite import: `import img from '../assets/icon.png'`
- Supabase Storage, 카카오 CDN은 허용

---

## 7. 페이지 생성 체크리스트

### 레이아웃

- [ ] 외부 컨테이너: `bg-white relative min-h-screen w-full flex justify-center`
- [ ] 내부 컨테이너: `w-full max-w-[440px] relative pb-[140px]`
- [ ] NavigationHeader 사용 또는 인라인 헤더 패턴
- [ ] 네비게이션 아래 60px 여백 (fixed 헤더 시)
- [ ] 하단 CTA 버튼: fixed bottom-0, 440px 제한, boxShadow
- [ ] iOS 바운스 방지 필요 시 `fixed inset-0` 패턴

### 스타일링

- [ ] 모든 텍스트/색상: inline style 사용
- [ ] `text-*`, `font-*`, `leading-*` Tailwind 클래스 미사용
- [ ] HEX 색상 arbitrary value → inline style
- [ ] `overflow-hidden` + `border-radius` → `transform-gpu` 추가

### 라우팅

```tsx
// App.tsx
import MyPage from './components/MyPage';

function MyPageWrapper() {
  const navigate = useNavigate();
  return <MyPage onBack={() => navigate(-1)} />;
}

<Route path="/my-path" element={<MyPageWrapper />} />
```

### 이미지

- [ ] 모든 이미지 `/public` 또는 `/src/assets`에 위치
- [ ] 외부 URL 미사용
- [ ] 콘솔에서 CSP 오류 확인

---

## 8. 컴포넌트 참조 가이드

### 페이지 레이아웃 참고

| 패턴 | 참고 컴포넌트 |
|------|-------------|
| 하단 CTA + 스크롤 바운스 방지 | `ResultCompletePage.tsx` |
| 전체 화면 + 바운스 방지 | `SajuSelectPage.tsx`, `FreeSajuSelectPage.tsx` |
| 프로필 레이아웃 | `ProfilePage.tsx` |

### 입력 폼 참고

| 패턴 | 참고 컴포넌트 |
|------|-------------|
| 전화번호 + 유효성 검사 | `AlimtalkInfoInputPage.tsx` |
| 생년월일/성별/시간 복합 폼 | `BirthInfoInput.tsx` |
| 무료 콘텐츠 입력 | `FreeBirthInfoInput.tsx` |

### 결과 페이지 참고

| 패턴 | 참고 컴포넌트 |
|------|-------------|
| 유료 결과 (BottomNavigation) | `UnifiedResultPage.tsx` |
| 무료 결과 | `FreeSajuDetail.tsx` |
| 전체 화면 로딩 | `LoadingPage.tsx` |

---

**최종 업데이트**: 2026-03-11
