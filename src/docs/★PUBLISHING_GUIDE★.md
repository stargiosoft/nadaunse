# 퍼블리싱 가이드 (Publishing Guide)

> **이 문서만 읽으면 바로 반응형 모바일 퍼블리싱을 시작할 수 있습니다.**
> Figma 디자인 → React 컴포넌트 변환 시 참고하세요.

---

## 1. 반응형 레이아웃 기본 구조

### 핵심 규칙
- **최소 너비**: 360px (모바일)
- **최대 너비**: 440px (PC에서도 440px로 중앙 정렬)
- **PC 뷰**: 440px 컨테이너가 화면 중앙에 위치

### 표준 페이지 레이아웃

```tsx
import ArrowLeft from './ArrowLeft';

export default function MyPage() {
  return (
    // 외부 컨테이너: 전체 화면 배경 + 중앙 정렬
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      {/* 내부 컨테이너: 최대 440px 제한, 하단 버튼 공간 확보 */}
      <div className="w-full max-w-[440px] relative pb-[140px]">

        {/* 상단 네비게이션 */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={handleBack} />
              <p className="font-semibold text-[18px] text-black text-center tracking-[-0.36px]">
                페이지 제목
              </p>
              <div className="w-[44px]" /> {/* 우측 공간 확보 */}
            </div>
          </div>
        </div>

        {/* 네비게이션 높이만큼 여백 (52px + 여유 8px) */}
        <div style={{ height: '60px' }} />

        {/* 메인 콘텐츠 */}
        <div style={{ padding: '12px 20px 40px 20px' }}>
          {/* 콘텐츠 내용 */}
        </div>

        {/* 하단 고정 버튼 */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
          style={{ boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)' }}
        >
          <div style={{ padding: '12px 20px' }}>
            <button
              className="w-full flex items-center justify-center"
              style={{
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#41a09e', // 활성화 색상
                // backgroundColor: '#f8f8f8', // 비활성화 색상
              }}
            >
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '25px',
                letterSpacing: '-0.32px',
                color: '#ffffff', // 활성화 텍스트 색상
                // color: '#b7b7b7', // 비활성화 텍스트 색상
              }}>
                버튼 텍스트
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
```

---

## 2. Tailwind CSS v4 스타일링 규칙

### ⚠️ 절대 금지 (globals.css 충돌)

```tsx
// ❌ 절대 사용 금지 - 폰트 관련 Tailwind 클래스
className="text-sm"        // 금지
className="text-lg"        // 금지
className="text-[15px]"    // 금지
className="font-bold"      // 금지
className="font-[500]"     // 금지
className="leading-5"      // 금지
className="leading-[20px]" // 금지
```

### ✅ 반드시 inline style 사용

```tsx
// ✅ 타이포그래피 - 무조건 inline style
style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '20px',
  letterSpacing: '-0.45px',
  color: '#6d6d6d',
}}

// ✅ 색상 - inline style 사용
style={{
  backgroundColor: '#fee500',
  color: '#151515',
  borderColor: '#e7e7e7',
}}
```

### ✅ Tailwind 사용 가능한 속성

```tsx
// ✅ 레이아웃 - Tailwind OK
className="flex flex-col items-center justify-center"
className="w-full max-w-[440px]"
className="relative absolute fixed"

// ✅ 간격 (토큰 기반) - Tailwind OK
className="gap-4 p-4 m-4"
className="px-5 py-3"

// ✅ 기타 유틸리티 - Tailwind OK
className="rounded-2xl overflow-hidden"
className="cursor-pointer transition-colors"
className="outline-none bg-transparent"
```

### ⚠️ Arbitrary Value 주의사항

```tsx
// ⚠️ Tailwind v4에서 일부 arbitrary value 작동 안 함
className="bg-[#f0f8f8]"  // 작동 안 할 수 있음 → inline style 사용
className="px-[7px]"      // 작동 안 할 수 있음 → inline style 사용

// ✅ 안전한 대안
style={{ backgroundColor: '#f0f8f8' }}
style={{ padding: '0 7px' }}
```

---

## 3. 공통 컴포넌트

### ArrowLeft (뒤로가기 버튼)

```tsx
import ArrowLeft from './ArrowLeft';

// 사용법
<ArrowLeft onClick={() => navigate(-1)} />

// 특징
// - 44x44px 터치 영역
// - 좌측 화살표 아이콘
// - 클릭 시 onCl ick 콜백 실행
```

### 상단 네비게이션 패턴

```tsx
import ArrowLeft from './ArrowLeft';

<div className="bg-white h-[52px] shrink-0 w-full z-20">
  <div className="flex flex-col justify-center size-full">
    <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
      <ArrowLeft onClick={handleBack} />
      <p className="font-semibold text-[18px] text-black text-center tracking-[-0.36px]">
        페이지 제목
      </p>
      <div className="w-[44px]" /> {/* 우측 공간 확보 */}
    </div>
  </div>
</div>
```

### 입력 필드 스타일

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

### 입력 필드 라벨

```tsx
<label
  style={{
    fontFamily: 'Pretendard Variable, sans-serif',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '-0.24px',
    color: '#848484',
  }}
>
  라벨 텍스트
</label>
```

---

## 4. 색상 팔레트

### 브랜드 색상

```tsx
// Primary (민트/틸)
'#41a09e'  // 메인 브랜드 색상, 활성화 버튼
'#368683'  // 강조 텍스트

// 카카오
'#fee500'  // 카카오 노란색 배경
'#191919'  // 카카오 아이콘 검정
```

### 텍스트 색상

```tsx
'#151515'  // 기본 텍스트 (진한 검정)
'#6d6d6d'  // 서브 텍스트 (회색)
'#848484'  // 라벨 텍스트 (연한 회색)
'#b7b7b7'  // 플레이스홀더, 비활성화 텍스트
```

### 배경/보더 색상

```tsx
'#ffffff'  // 흰색 배경
'#f8f8f8'  // 비활성화 버튼 배경
'#f0f8f8'  // 연한 민트 배경 (버튼 비활성화 시)
'#f9f9f9'  // 구분선, 카드 배경
'#f3f3f3'  // 섹션 구분선
'#e7e7e7'  // 입력 필드 테두리
'#d4d4d4'  // 연한 테두리
```

---

## 5. 타이포그래피 스타일

### 대제목 (22px)

```tsx
style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '32.5px',
  letterSpacing: '-0.22px',
  color: '#151515',
}}
```

### 본문 (15px)

```tsx
style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '20px',
  letterSpacing: '-0.45px',
  color: '#6d6d6d',
}}
```

### 버튼 텍스트 (16px)

```tsx
style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '25px',
  letterSpacing: '-0.32px',
  color: '#ffffff',
}}
```

### 라벨 (12px)

```tsx
style={{
  fontFamily: 'Pretendard Variable, sans-serif',
  fontSize: '12px',
  fontWeight: 400,
  lineHeight: '16px',
  letterSpacing: '-0.24px',
  color: '#848484',
}}
```

---

## 6. 하단 고정 버튼 패턴

### 기본 구조

```tsx
{/* 하단 고정 버튼 컨테이너 */}
<div
  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
  style={{
    boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)',
  }}
>
  <div style={{ padding: '12px 20px' }}>
    <button
      onClick={handleClick}
      disabled={!isValid}
      className="w-full flex items-center justify-center transition-colors"
      style={{
        height: '56px',
        borderRadius: '16px',
        backgroundColor: isValid ? '#41a09e' : '#f8f8f8',
        cursor: isValid ? 'pointer' : 'not-allowed',
        border: 'none',
      }}
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

### 주요 포인트
- `fixed bottom-0`: 화면 하단 고정
- `left-1/2 -translate-x-1/2`: 정확한 중앙 정렬
- `w-full max-w-[440px]`: 최대 너비 제한
- `boxShadow`: 상단 페이드 효과로 콘텐츠와 자연스러운 경계

---

## 7. 아이콘 컴포넌트 패턴

### SVG 아이콘 정의

```tsx
// 컴포넌트 내부에 정의
const MyIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10..."
      fill="#191919"
    />
  </svg>
);
```

### 아이콘 박스 스타일

```tsx
<div
  className="flex items-center justify-center shrink-0"
  style={{
    width: '44px',
    height: '44px',
    backgroundColor: '#fee500',
    borderRadius: '16px',
    border: '1px solid #fee500',
  }}
>
  <MyIcon />
</div>
```

---

## 8. 페이지 생성 체크리스트

### 퍼블리싱 전 확인사항

- [ ] 외부 컨테이너: `bg-white relative min-h-screen w-full flex justify-center`
- [ ] 내부 컨테이너: `w-full max-w-[440px] relative pb-[140px]`
- [ ] ArrowLeft 컴포넌트 사용 (뒤로가기 버튼)
- [ ] 네비게이션 높이: `h-[52px] shrink-0`
- [ ] 네비게이션 아래 60px 여백 추가
- [ ] 하단 버튼: `fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px]`
- [ ] 하단 버튼 boxShadow: `0px -8px 16px 0px rgba(255, 255, 255, 0.76)`
- [ ] 모든 텍스트 스타일: inline style 사용
- [ ] 모든 색상: inline style 사용
- [ ] `text-*`, `font-*`, `leading-*` 클래스 사용 안 함
- [ ] iOS Safari 스크롤 바운스 방지: `fixed inset-0` 패턴 고려

### App.tsx 라우트 등록

```tsx
// 1. import 추가
import MyPage from './components/MyPage';

// 2. Wrapper 함수 생성 (필요시)
function MyPageWrapper() {
  const navigate = useNavigate();
  return <MyPage onBack={() => navigate(-1)} />;
}

// 3. Route 등록
<Route path="/my-path" element={<MyPageWrapper />} />
```

---

## 9. 이미지 처리 (CSP 제한)

### CSP(Content Security Policy)란?
- 웹 보안 정책으로 외부 리소스 로딩을 제한
- 나다운세는 `img-src` 지시어로 이미지 도메인 제한
- **외부 이미지 URL 사용 시 브라우저가 차단함**

### 허용된 이미지 도메인
```
img-src 'self' data: blob: https://*.supabase.co https://*.kakaocdn.net
```

- `'self'`: 같은 도메인 (nadaunse.com, staging.nadaunse.com)
- `data:`, `blob:`: 인라인 데이터 URI
- `https://*.supabase.co`: Supabase Storage
- `https://*.kakaocdn.net`: 카카오 프로필 이미지

### 이미지 저장 및 사용 방법

#### ❌ 잘못된 예시 (CSP 차단됨)
```tsx
// 외부 URL 사용 - 브라우저가 차단함
const bgImage = "https://i.postimg.cc/WzwkjYXT/background.jpg";
const iconUrl = "https://cdn.example.com/icon.png";

<img src={bgImage} alt="Background" />
```

**콘솔 오류**:
```
Loading the image 'https://i.postimg.cc/...' violates the following
Content Security Policy directive: "img-src 'self' data: blob: ...".
The action has been blocked.
```

#### ✅ 올바른 예시 1: public 폴더 사용
```tsx
// 1. 이미지 파일을 /public 폴더에 저장
//    파일 위치: /Users/star/nadaunse/public/background.jpg

// 2. 절대 경로로 참조
const bgImage = "/background.jpg";

<img src={bgImage} alt="Background" />
```

#### ✅ 올바른 예시 2: Vite import 사용
```tsx
// 1. 이미지 파일을 /src/assets 폴더에 저장
//    파일 위치: /Users/star/nadaunse/src/assets/icon.png

// 2. import 구문 사용
import iconImage from '../assets/icon.png';

<img src={iconImage} alt="Icon" />
```

#### ✅ 올바른 예시 3: Supabase Storage 사용
```tsx
// Supabase Storage에 업로드된 이미지는 CSP 허용됨
const thumbnailUrl = "https://hyltbeewxaqashyivilu.supabase.co/storage/v1/object/public/thumbnails/image.jpg";

<img src={thumbnailUrl} alt="Thumbnail" />
```

### 이미지 다운로드 및 변환 가이드

외부 이미지를 사용해야 하는 경우:

```bash
# 1. 이미지 다운로드
cd /Users/star/nadaunse/public
curl -L "https://example.com/image.jpg" -o my-image.jpg

# 2. 코드에서 절대 경로로 참조
# const myImage = "/my-image.jpg";
```

### 체크리스트

- [ ] 모든 이미지가 `/public` 폴더 또는 `/src/assets`에 있음
- [ ] 외부 URL 사용 금지 (https://i.postimg.cc, https://cdn.example.com 등)
- [ ] Supabase Storage 이미지는 사용 가능
- [ ] 카카오 프로필 이미지는 사용 가능
- [ ] 개발자 도구 콘솔에서 CSP 오류 확인

---

## 10. 실제 예시: AlimtalkInfoInputPage

```tsx
import { useState } from 'react';
import ArrowLeft from './ArrowLeft';

// 아이콘 정의
const KakaoIcon = () => (
  <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="..." fill="#191919" />
  </svg>
);

interface Props {
  onBack: () => void;
  onNext?: (phoneNumber: string) => void;
}

export default function AlimtalkInfoInputPage({ onBack, onNext }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const isValidPhoneNumber = /^[0-9]{10,11}$/.test(phoneNumber);

  return (
    <div className="bg-white relative min-h-screen w-full flex justify-center">
      <div className="w-full max-w-[440px] relative pb-[140px]">

        {/* 상단 네비게이션 */}
        <div className="bg-white h-[52px] shrink-0 w-full z-20">
          <div className="flex flex-col justify-center size-full">
            <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
              <ArrowLeft onClick={onBack} />
              <p className="font-semibold text-[18px] text-black text-center tracking-[-0.36px]">
                알림톡 정보 입력
              </p>
              <div className="w-[44px]" />
            </div>
          </div>
        </div>

        <div style={{ height: '60px' }} />

        <div style={{ padding: '12px 20px 40px 20px' }}>
          {/* 아이콘 */}
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

          {/* 제목 */}
          <p style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            lineHeight: '32.5px',
            color: '#151515',
          }}>
            결과가 나오면 <span style={{ color: '#41a09e' }}>알림톡</span> 보내드릴게요
          </p>

          {/* 입력 필드 */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="'-'하이픈 없이 숫자만 입력해 주세요"
            className="w-full outline-none bg-transparent"
            style={{
              fontFamily: 'Pretendard Variable, sans-serif',
              fontSize: '15px',
              color: '#151515',
            }}
          />
        </div>

        {/* 하단 버튼 */}
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white"
          style={{ boxShadow: '0px -8px 16px 0px rgba(255, 255, 255, 0.76)' }}
        >
          <div style={{ padding: '12px 20px' }}>
            <button
              disabled={!isValidPhoneNumber}
              className="w-full flex items-center justify-center"
              style={{
                height: '56px',
                borderRadius: '16px',
                backgroundColor: isValidPhoneNumber ? '#41a09e' : '#f8f8f8',
                border: 'none',
              }}
            >
              <span style={{
                fontFamily: 'Pretendard Variable, sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '25px',
                letterSpacing: '-0.32px',
                color: isValidPhoneNumber ? '#ffffff' : '#b7b7b7',
              }}>
                다음
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 11. iOS Safari 호환성

### 스크롤 바운스 방지 레이아웃 (⭐ 권장)

iOS Safari에서 화면이 위아래로 바운스되는 버그를 **완전히 제거**하는 패턴입니다.

```tsx
// ✅ 스크롤 바운스 제거 (SajuSelectPage, ResultCompletePage 패턴)
export default function MyPage() {
  return (
    <div className="bg-white fixed inset-0 flex justify-center">
      <div className="w-full max-w-[440px] h-full flex flex-col bg-white">

        {/* Top Navigation - shrink-0로 고정 높이 */}
        <div className="bg-white h-[52px] shrink-0 z-20 w-full">
          <div className="flex items-center justify-between px-[12px] h-full">
            <ArrowLeft onClick={handleBack} />
            <p className="font-semibold text-[18px] text-black text-center">
              페이지 제목
            </p>
            <div className="w-[44px]" />
          </div>
        </div>

        {/* Main Content - flex-1 overflow-auto로 스크롤 영역 설정 */}
        <div className="flex-1 overflow-auto w-full">
          <div className="p-[20px]">
            {/* 콘텐츠 */}
          </div>
        </div>

        {/* Bottom Fixed Button (선택사항) */}
        <div className="shrink-0 w-full bg-white" style={{ padding: '12px 20px' }}>
          <button className="w-full" style={{ height: '56px', borderRadius: '16px' }}>
            버튼
          </button>
        </div>

      </div>
    </div>
  );
}
```

**핵심 포인트**:
- `fixed inset-0`: 화면 전체 고정
- `h-full flex flex-col`: 세로 플렉스 컨테이너
- `shrink-0`: Top Navigation과 Bottom Button 고정 높이
- `flex-1 overflow-auto`: Main Content만 스크롤

**참고 컴포넌트**:
- `SajuSelectPage.tsx`
- `FreeSajuSelectPage.tsx`
- `ResultCompletePage.tsx`
- `ProfilePage.tsx`

---

### overflow + border-radius 조합

```tsx
// ✅ iOS Safari에서 둥근 모서리 정상 렌더링
<div className="overflow-hidden rounded-2xl transform-gpu">
  {/* 콘텐츠 */}
</div>

// ❌ iOS Safari에서 잘릴 수 있음
<div className="overflow-hidden rounded-2xl">
  {/* 콘텐츠 */}
</div>
```

### 스크롤 영역

```tsx
// iOS Safari 모멘텀 스크롤
<div
  className="overflow-y-auto"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
  {/* 스크롤 콘텐츠 */}
</div>
```

---

## 12. 실제 프로젝트 컴포넌트 참조

퍼블리싱 시 참고할 만한 실제 컴포넌트들입니다.

### 레이아웃 패턴
- **`ResultCompletePage.tsx`**: 하단 고정 버튼 + 스크롤 바운스 방지 (`fixed inset-0` 패턴)
- **`SajuSelectPage.tsx`**: 전체 화면 레이아웃 + 스크롤 바운스 방지
- **`FreeSajuSelectPage.tsx`**: 사주 선택 페이지 레이아웃
- **`ProfilePage.tsx`**: 프로필 페이지 레이아웃

### 입력 폼
- **`AlimtalkInfoInputPage.tsx`**: 전화번호 입력 필드 + 유효성 검사
- **`BirthInfoInput.tsx`**: 복잡한 입력 폼 (생년월일, 성별, 시간 등)
- **`FreeBirthInfoInput.tsx`**: 무료 콘텐츠 입력 폼

### 로딩 & 결과 페이지
- **`LoadingPage.tsx`**: 전체 화면 로딩 페이지 + 하단 버튼
- **`UnifiedResultPage.tsx`**: 운세 결과 페이지 (스크롤 영역)
- **`FreeSajuDetail.tsx`**: 무료 사주 결과 상세 페이지

### 공통 UI 컴포넌트
- **`ArrowLeft.tsx`**: 뒤로가기 버튼 컴포넌트
- **`ui/PageLoader.tsx`**: 공통 로딩 스피너

---

**최종 업데이트**: 2026-01-19
