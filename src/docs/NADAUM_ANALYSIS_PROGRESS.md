# 나다움 분석 시각화 개선 - 진행 상황

> **작성일**: 2026-03-10
> **브랜치**: staging
> **빌드**: 통과 (vite build 성공)
> **배포**: staging Edge Function 배포 완료, 프론트엔드 미배포

---

## 1. 완료된 작업

### 1-1. NadaumAnalysisPage.tsx (메인 페이지)

| 항목 | 상태 | 설명 |
|------|------|------|
| 레이더 차트 | 기존 유지 | 6축 성향 태그 분포 (recharts) |
| 나다움 유형 카드 | **완료** | MBTI 스타일 16유형 (`computeNadaumType`) |
| 오행 에너지 분포 바 차트 | **코드 완료, 미검증** | 만세력 API `발달오행` 데이터 기반 수평 바 차트 |
| 태그 1줄 가로 스크롤 | **완료** | `overflow-x-auto` + `shrink-0` |
| 띠 이미지 원형 크롭 | **완료** | `object-cover` + 48px |
| zodiacCalculator 에러 수정 | **완료** | 숫자→문자열 시그니처 수정 |
| 상세 분석 해금 → 친구 초대 기반 | **완료** | `referralRequired` 0/1/2/3/4 + ShareRewardModal |
| getAuthUser() 디스트럭처링 | **완료** | `const { data: { user } }` |

### 1-2. NadaumAnalysisDetail.tsx (상세 페이지)

| 항목 | 상태 | 설명 |
|------|------|------|
| ScoreGauge (반원형 0-100) | **완료** | SVG + motion 애니메이션 |
| SpectrumBar (성향 스펙트럼) | **완료** | 카테고리당 2축, 그라디언트 바 + 인디케이터 점 |
| metadata 렌더링 | **완료** | `score`, `spectrum` 있으면 텍스트 섹션 위에 표시 |
| getAuthUser() 디스트럭처링 | **완료** | 동일 |

### 1-3. Edge Function (generate-nadaum-analysis)

| 항목 | 상태 | 설명 |
|------|------|------|
| AI JSON 출력 포맷 | **완료** | `{ text, score, spectrum }` |
| 카테고리별 스펙트럼 축 정의 | **완료** | 연애(열정↔안정, 주도↔맞춤), 기질(외향↔내향, 이성↔감성) 등 |
| metadata JSONB 저장 | **완료** | upsert 시 metadata 컬럼에 저장 |
| 캐시 재생성 로직 | **완료** | `metadata?.score == null`이면 강제 재생성 |
| staging 배포 | **완료** | `hyltbeewxaqashyivilu` |
| production 배포 | **미완료** | `kcthtpmxffppfbkjjkub` |

### 1-4. DB 변경

```sql
ALTER TABLE nadaum_analyses ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
```
- staging (`hyltbeewxaqashyivilu`): 적용 완료
- production (`kcthtpmxffppfbkjjkub`): 적용 완료

---

## 2. 미해결 문제

### 2-1. 오행 에너지 분포 차트가 안 보임 → **해결됨**

**원인**: 만세력 API가 **한자 키**(木, 火, 土, 金, 水)를 반환하는데 코드는 **한글 키**(목, 화, 토, 금, 수)로만 매칭
- NFC 정규화 문제가 아니라 **한자 vs 한글 키 불일치**가 원인

**수정**: `OHENG_ELEMENTS` 배열로 한글/한자 키 모두 정의, 한자 키 우선 매칭
- `baldal[el.hanja] ?? baldal[el.kr]` 로 양쪽 지원

### 2-2. 디버그 로그 잔존

`NadaumAnalysisPage.tsx` 라인 297~318에 `console.log` 4개 남아있음:
```
[나다움] 만세력 요청 시작...
[나다움] 만세력 결과: ...
[나다움] 발달오행: ...
[나다움] 파싱된 오행: N 개
```
→ 검증 완료 후 제거 필요

### 2-3. 상세 페이지 Score/Spectrum 미검증

- Edge Function에서 JSON 포맷으로 AI 응답을 파싱하도록 변경함
- 기존 캐시(metadata 없음)는 자동 재생성되도록 처리했으나, 실제로 열어봐야 확인 가능
- staging에서 상세 분석 하나 열어서 score 게이지 + spectrum 바 표시되는지 확인 필요

---

## 3. 커밋 히스토리 (staging 브랜치, 최신순)

```
8bc62b94 debug: 오행 로드 전체 과정 콘솔 로그 추가
8cfe4183 fix: 오행 데이터를 메인 useEffect에서 동기적으로 로드
925e05b6 debug: 오행 렌더링 상태 디버그 출력 추가 (임시)
bb55ffe4 fix: 오행 PieChart → 수평 바 차트로 교체
6d5ae7f6 fix: 오행 useEffect cancelled 제거 + 의존성 saju?.id로 변경
42adb286 fix: 오행 도넛 안 나오는 문제 수정 (useEffect race condition)
5fbe1e2b feat: 상세 분석 해금을 친구 초대 기반으로 변경
f2d1e3f0 fix: 띠 이미지 원형 크롭 (object-cover + 풀사이즈)
7f0da175 fix: zodiacCalculator 호출 시그니처 수정 (숫자→문자열)
7c2ece95 fix: metadata 없는 캐시 재생성 + 오행 도넛 디버깅 로그 추가
bb6b93b4 fix: 나다움 태그 모바일에서 1줄 가로 스크롤로 변경
3cd67cc1 feat: 오행 도넛 차트, 나다움 유형 카드, 상세 분석 게이지+스펙트럼 추가
cf0f5586 fix: getAuthUser() 반환값 디스트럭처링 수정 (나다움 분석 페이지)
```

**주의**: `parseOhengData()` 수정은 아직 커밋되지 않은 unstaged 변경입니다.

---

### 2-4. 바이럴/재미 요소 부족 → **개선 완료**

**추가된 바이럴 요소**:
1. **나다움 유형 카드 리디자인**: 그라디언트 배경 + 스프링 애니메이션 + 명언(quote) + 공유 버튼
2. **Web Share API 공유**: "내 유형 공유하기" 버튼 → 네이티브 공유 or 클립보드 복사
3. **각 섹션 인사이트 카피**: DNA 차트, 성향 밸런스, 오행 에너지에 감정적 한 줄 코멘트
4. **헤더 카피 개선**: "운세가 밝혀낸 당신의 숨겨진 성격 DNA"
5. **16가지 유형별 quote**: 공유 시 사용되는 명언 텍스트

## 4. 남은 작업 (다음 세션)

1. **디버그 로그 제거**: 검증 후 `console.log('[나다움]...')` 제거
2. **상세 페이지 검증**: 카테고리 하나 열어서 score 게이지 + spectrum 바 확인
3. **production 배포**: Edge Function + 프론트엔드 (cherry-pick)
4. (선택) 오행 차트에 총합 100%가 아닌 경우 대응

---

## 5. 핵심 파일 목록

| 파일 | 역할 |
|------|------|
| `src/components/NadaumAnalysisPage.tsx` | 메인 분석 페이지 (876줄) |
| `src/components/NadaumAnalysisDetail.tsx` | 상세 분석 페이지 (485줄) |
| `supabase/functions/generate-nadaum-analysis/index.ts` | AI 분석 생성 Edge Function (443줄) |
| `src/lib/manseService.ts` | 만세력 API 호출 + 캐시 |
| `src/hooks/useShareRewardStatus.ts` | 공유 리워드 상태 (친구 초대 수) |
| `src/components/ShareRewardModal.tsx` | 공유/초대 바텀시트 모달 |

---

## 6. 상세 분석 카드 해금 체계

| 순서 | 카테고리 | referralRequired | 해금 조건 |
|------|----------|------------------|-----------|
| 1 | 기질·성격 🧬 | 0 | 무료 (즉시 사용) |
| 2 | 연애·궁합 💕 | 1 | 친구 1명 초대 |
| 3 | 재물·금전 💰 | 2 | 친구 2명 초대 |
| 4 | 직업·적성 💼 | 3 | 친구 3명 초대 |
| 5 | 건강·체질 🏥 | 4 | 친구 4명 초대 |

잠긴 카드 클릭 시 → `ShareRewardModal` 열림 (기존 공유 리워드 모달 재사용)
