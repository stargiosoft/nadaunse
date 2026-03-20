# SNS 일괄 발행 및 예약 — 분석 및 채택 방향

> **작성일**: 2026-03-20
> **채택**: Ayrshare Free Plan

---

## 1. 배경

콘텐츠 스튜디오에서 제작한 카드뉴스/숏폼/광고소재를 SNS에 일괄 업로드하고 예약 발행하는 기능 필요.

---

## 2. SNS 플랫폼별 API 지원 현황

| 플랫폼 | 이미지 | 영상 | 예약 | API | 비고 |
|---------|:---:|:---:|:---:|-----|------|
| **Instagram** | O | O | O | Graph API | 비즈니스 계정 필수, 앱 심사 2~4주 |
| **Facebook** | O | O | O | Graph API | `scheduled_publish_time` 파라미터 |
| **X (Twitter)** | O | O | X | X API v2 | 예약 공식 미지원. Free 월 1,500건 / Basic $200/월 |
| **YouTube** | - | O | O | Data API v3 | 일일 업로드 ~6건 제한 |
| **TikTok** | - | O | O | Content Posting API | 앱 심사 매우 까다로움 (수주~수개월) |
| **LinkedIn** | O | O | O | Marketing API | Organization 페이지 발행은 추가 권한 |
| **Threads** | O | O | O | Meta Graph API | 2024년 공개, 비교적 쉬움 |
| **네이버 블로그** | X | X | X | 없음 | 공식 API 없음 |

---

## 3. 방법별 비교 분석

### 3.1 통합 SaaS API

| 서비스 | 월 비용 | API | 지원 채널 | 예약 | 무료 플랜 | 특징 |
|--------|---------|:---:|----------|:---:|:---:|------|
| **Ayrshare** | Free $0 (50건) / Premium $49 | REST API (Node/Python SDK) | IG, FB, X, TikTok, YT, LinkedIn 등 10+ | O | O | **API-first 설계**, 1회 호출로 멀티 플랫폼 동시 발행 |
| **Buffer** | $6/채널/월 (6채널=$36) | 제한적 | IG, FB, X, TikTok, YT, LinkedIn 등 | O | O (3채널) | API 업데이트 느림 |
| **Publer** | $12/월 (10채널) | 있음 | IG, FB, X, TikTok, YT, LinkedIn 등 | O | O (3채널) | 문서화 보통 |
| **Later** | $25/월~ | **없음** | IG, FB, X, TikTok, LinkedIn | O | X | UI 대시보드 중심, 탈락 |
| **Hootsuite** | $99/월~ | Enterprise만 | 대부분 | O | X | 비용 대비 API 접근성 낮음, 탈락 |
| **SocialBee** | $29/월~ | 제한적 | IG, FB, X, TikTok, YT, LinkedIn 등 | O | X | UI/통합 중심 |

### 3.2 오픈소스 / 셀프호스팅

| 서비스 | 월 비용 | API | 지원 채널 | 특징 | 비고 |
|--------|---------|:---:|----------|------|------|
| **Postiz** | $0 + 서버비 $5~10 | O | 11개 채널 | Next.js+NestJS+Redis+PostgreSQL | GitHub 15k+ stars, 2024~ 신규 |
| **Mixpost** | $0 (Lite) / $299 1회 (Pro) | O | 8개 채널 | Laravel+Vue.js | PHP/Laravel 필요 |
| **Socioboard** | $0 | O | 6개 채널 | Node.js+MySQL | 유지보수 빈도 낮음, 탈락 |

**Postiz 셀프호스팅 검토 결과**: Supabase에서 불가 (NestJS+Redis 풀 서버 필요). 별도 서버(Railway $5~, VPS $4~6) 필요하므로 관리 포인트 증가.

### 3.3 자동화 플랫폼

| 서비스 | 월 비용 | 방식 | 특징 | 비고 |
|--------|---------|------|------|------|
| **N8N 셀프호스팅** | $0 + 서버비 $5~10 | webhook → 채널별 분기 | 워크플로우 자유 설계 | 각 SNS OAuth 직접 설정, 별도 서버 필요 |
| **N8N Cloud** | $24/월~ | webhook | 관리 불필요 | 2,500 실행/월 |
| **Make** | $10~19/월 | 모듈 기반 | SNS 모듈 풍부 | 6채널 동시 발행 = 6+ ops/건 |
| **Zapier** | $30~74/월 | task 기반 | 앱 생태계 최대 | 비용 높음, 탈락 |

### 3.4 직접 API 연동

| 항목 | 내용 |
|------|------|
| **비용** | 대부분 무료. 단 X/Twitter Basic $200/월 (Free 월 1,500건) |
| **개발 기간** | 풀타임 1~2주 (기본), 안정화 1개월+ |
| **유지보수** | 각 플랫폼 API 변경 시 지속 업데이트 필요 |
| **핵심 장벽** | X API 비용 ($200/월), TikTok 심사 (수주~수개월), 6개 플랫폼 OAuth 관리 |

---

## 4. 비용 효율 순위

| 순위 | 방법 | 월 비용 | API 접근 | 추천 상황 |
|------|------|---------|----------|-----------|
| **1** | **Ayrshare Free** | $0 | REST API 최적 | 월 50건 이하, 즉시 시작, 유지보수 없음 |
| 2 | Postiz 셀프호스팅 | $5~10 | 완전 자유 | 서버 관리 가능, 무제한 필요 시 |
| 3 | N8N 셀프호스팅 | $5~10 | webhook | 다른 자동화 파이프라인도 함께 필요 시 |
| 4 | 직접 API 연동 | $0~200 | 완전 자유 | 최대 통제권, 높은 개발 비용 감수 시 |
| 5 | Ayrshare Premium | $49 | REST API 최적 | 월 50건 초과, 무제한 필요 시 |

---

## 5. 채택: Ayrshare Free Plan

### 5.1 채택 이유

| 기준 | 평가 |
|------|------|
| **비용** | $0 (월 50 포스트 무료) |
| **API 품질** | API-first 설계, Node.js SDK, 문서화 우수 |
| **구현 난이도** | API Key 1개 + 1회 호출로 멀티 플랫폼 동시 발행 |
| **인프라** | 추가 서버 불필요 (기존 Supabase Edge Function에서 호출) |
| **발행량** | 내부 콘텐츠 제작 도구 → 월 50건 충분 |
| **확장성** | 초과 시 Premium($49/월) 전환으로 무제한 |
| **채널** | Instagram, Facebook, X, TikTok, YouTube, LinkedIn 등 10+ |

### 5.2 탈락 사유

| 방법 | 탈락 이유 |
|------|-----------|
| Postiz 셀프호스팅 | Supabase 불가, 별도 서버 필요 → 관리 포인트 증가 |
| N8N | 별도 서버 + 각 SNS OAuth 직접 설정 → 과도한 세팅 |
| 직접 API 연동 | X API $200/월, TikTok 심사 수주, 6개 플랫폼 유지보수 부담 |
| Buffer/Publer | API 기능 제한적, Ayrshare 대비 이점 없음 |
| Hootsuite/Later | 비용 높음, API 미제공 또는 상위 플랜만 |

### 5.3 구현 계획

```
[콘텐츠 스튜디오]                         [Ayrshare]
카드뉴스/숏폼/광고소재 제작 완료
        │
        └─ "SNS 발행" 버튼 클릭
            ├─ 채널 선택 (IG/FB/X/LinkedIn/TikTok/YT)
            ├─ 캡션 + 해시태그 입력
            ├─ 예약 시간 설정 (선택)
            │
            └─ Ayrshare API 1회 호출 ──→  멀티 플랫폼 동시 발행/예약
                                          └─ 결과 반환 (성공/실패/postId)
```

### 5.4 사전 준비

1. Ayrshare 가입 → API Key 발급
2. SNS 계정 연결 (Instagram 비즈니스, Facebook 페이지, X 등)
3. Supabase Secret에 `AYRSHARE_API_KEY` 등록

### 5.5 스케일업 경로

- 월 50건 초과 시 → Ayrshare Premium ($49/월, 무제한)
- 완전 자동화 필요 시 → N8N 추가 (트렌드 → 자동 생성 → 예약 발행 파이프라인)

---

**최종 업데이트**: 2026-03-20
