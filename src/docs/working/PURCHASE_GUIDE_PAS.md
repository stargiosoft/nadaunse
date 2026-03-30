# 맞춤 안내 PAS 구조 개선 — 세션 인계서

> **작업일**: 2026-03-27
> **상태**: Staging 배포 완료, 프롬프트 튜닝 진행 중
> **배포 환경**: Staging (`hyltbeewxaqashyivilu`)
> **프로덕션 미배포**

---

## 배경

유료 전환율이 낮은 원인 분석 → 무료→유료 브릿지에 PAS(Problem-Agitate-Solution) 구조가 없었음.
기존: "변화된 모습을 파는" 2줄 카피 → Agitate 없이 바로 솔루션 제시 → 호기심 0.

스레드 운세 상담사 스타일 참고:
- 사주적 진단 → 문제 증폭 → 호기심 강화 → 솔루션 제안

---

## 변경된 파일

### 1. `supabase/functions/generate-purchase-guide/index.ts`

**전면 재작성**. 주요 변경:

- **3-tier 폴백 시스템**:
  - Tier 1: 사주(saju_records → Stargio API) + 태그 → 사주 기반 PAS
  - Tier 2: 태그만 → 바넘효과 스타일 PAS
  - Tier 3: 둘 다 없음 → 범용 바넘 PAS (로그인 유저 대상)

- **Stargio API 연동 추가**: `fetchSajuEssence()` 함수
  - 대표 사주(is_primary=true)의 birth_date/time/gender로 API 호출
  - 4개 핵심 필드만 추출: 물상론.닉네임, 격구분, 사주강약, 용신오행
  - 재시도 2회, 실패 시 Tier 2로 폴백

- **PAS 프롬프트 구조**:
  - Problem: 콘텐츠 주제 키워드 필수 포함
  - Agitate: 주제별 구체적 손실/위험 언급 + 호기심 증폭
  - Solution: 이 콘텐츠에서 답을 찾을 수 있음 연결

### 2. `src/components/MasterContentDetailPage.tsx`

- `hasTraitTags` 조건 제거 → 로그인 유저면 태그 없어도 가이드 요청
- 캐시 키 `purchase_guide_v1_` → `purchase_guide_v2_`
- DEV 기본값 PAS 스타일로 변경

---

## 현재 프롬프트 튜닝 이슈 (해결 필요)

### 1차 시도: 추상적, 범용적 — 콘텐츠 주제 연결 안 됨
- "잠재력의 원석이 다듬어지지 않은 채..." → 무슨 콘텐츠인지 모름
- **해결**: 콘텐츠 키워드 필수 포함 원칙 추가 → 개선됨

### 2차 시도: 문장이 너무 길고 TMI
- 쉼표로 계속 이어붙여서 한 문장 50자+ → 읽기 힘듦
- **해결**: 한 문장 최대 25자, 전체 80~120자, "."으로 끊기 규칙 추가
- **아직 미검증** — 다음 세션에서 결과 확인 필요

---

## 다음 세션 TODO

1. **프롬프트 결과 검증**: 짧은 문장 규칙이 잘 지켜지는지 여러 콘텐츠에서 확인
2. **gpt-4.1-nano 한계 판단**: 프롬프트를 잘 따르지 못하면 gpt-4.1-mini로 업그레이드 검토
3. **Tier별 품질 비교**: Tier 1(사주+태그) vs Tier 2(태그만) vs Tier 3(범용) 실제 출력 비교
4. **프로덕션 배포**: 품질 확인 후 `--project-ref kcthtpmxffppfbkjjkub`로 배포
5. **A/B 테스트 고려**: 기존 카피 vs PAS 카피 전환율 비교 방법 논의

---

## 배포 명령어

```bash
# Staging
npx supabase functions deploy generate-purchase-guide --project-ref hyltbeewxaqashyivilu

# Production (품질 확인 후)
npx supabase functions deploy generate-purchase-guide --project-ref kcthtpmxffppfbkjjkub
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `supabase/functions/generate-purchase-guide/index.ts` | Edge Function (핵심) |
| `src/components/MasterContentDetailPage.tsx` | UI 렌더링 + API 호출 |
| `src/docs/business/UNIVERSAL_GROWTH_FORMULA.md` | PAS 프레임워크 원본 |
