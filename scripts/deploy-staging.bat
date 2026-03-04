@echo off
chcp 65001 > nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🧪 나다운세 스테이징 Edge Functions 배포
echo    Project: hyltbeewxaqashyivilu (Staging)
echo    함수: 38개 (--no-verify-jwt: 11개)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set PROJECT_REF=hyltbeewxaqashyivilu

echo.
echo ──── AI 생성 (10개) ────
echo.

echo [1/32] generate-content-answers (진입점)
call npx supabase functions deploy generate-content-answers --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [2/32] generate-saju-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [3/32] generate-tarot-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-tarot-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [4/32] generate-free-preview
call npx supabase functions deploy generate-free-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [5/32] generate-saju-preview
call npx supabase functions deploy generate-saju-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [6/32] generate-tarot-preview
call npx supabase functions deploy generate-tarot-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [7/32] generate-master-content
call npx supabase functions deploy generate-master-content --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [8/32] generate-image-prompt
call npx supabase functions deploy generate-image-prompt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [9/32] generate-thumbnail
call npx supabase functions deploy generate-thumbnail --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [10/32] extract-trait-tags
call npx supabase functions deploy extract-trait-tags --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 주간 보고서 (4개) ────
echo.

echo [11/32] generate-weekly-report (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-weekly-report --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [12/32] generate-weekly-reports-batch (--no-verify-jwt, pg_cron 호출)
call npx supabase functions deploy generate-weekly-reports-batch --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [13/32] send-report-alimtalk (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy send-report-alimtalk --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [14/32] get-failed-reports
call npx supabase functions deploy get-failed-reports --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 쿠폰 관리 (4개) ────
echo.

echo [15/32] get-available-coupons
call npx supabase functions deploy get-available-coupons --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [16/32] apply-coupon-to-order
call npx supabase functions deploy apply-coupon-to-order --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [17/32] issue-welcome-coupon
call npx supabase functions deploy issue-welcome-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [18/32] issue-revisit-coupon
call npx supabase functions deploy issue-revisit-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 결제/환불/새싹 (5개) ────
echo.

echo [19/36] payment-webhook (--no-verify-jwt, PortOne 서버 콜백)
call npx supabase functions deploy payment-webhook --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [20/36] process-payment
call npx supabase functions deploy process-payment --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [21/36] process-refund
call npx supabase functions deploy process-refund --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [22/36] sprout-charge (새싹 충전)
call npx supabase functions deploy sprout-charge --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [23/36] sprout-deduct (새싹 차감)
call npx supabase functions deploy sprout-deduct --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 알림 (1개) ────
echo.

echo [24/36] send-alimtalk (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy send-alimtalk --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 사용자/마스터 콘텐츠 (2개) ────
echo.

echo [25/36] users
call npx supabase functions deploy users --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [26/36] master-content
call npx supabase functions deploy master-content --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 모니터링/통계 (3개) ────
echo.

echo [27/36] sentry-slack-webhook (--no-verify-jwt, Sentry 서버 콜백)
call npx supabase functions deploy sentry-slack-webhook --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [28/36] get-ga-stats
call npx supabase functions deploy get-ga-stats --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [29/36] cleanup-unconfirmed-tags (--no-verify-jwt, pg_cron 호출)
call npx supabase functions deploy cleanup-unconfirmed-tags --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── SEO (2개) ────
echo.

echo [30/36] generate-sitemap (--no-verify-jwt, Google 크롤러 접근)
call npx supabase functions deploy generate-sitemap --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [31/36] index-now
call npx supabase functions deploy index-now --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 소유자 확인 (2개) ────
echo.

echo [32/36] get-order-owner
call npx supabase functions deploy get-order-owner --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [33/36] get-report-owner
call npx supabase functions deploy get-report-owner --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 유틸리티 (1개) ────
echo.

echo [34/36] trigger-rebuild
call npx supabase functions deploy trigger-rebuild --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── AI 구매 가이드 (1개) ────
echo.

echo [35/36] generate-purchase-guide
call npx supabase functions deploy generate-purchase-guide --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 만세력 (1개) ────
echo.

echo [36/38] get-manse-data (--no-verify-jwt, 비로그인 공개 접근)
call npx supabase functions deploy get-manse-data --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ──── 공유 리워드 (2개) ────
echo.

echo [37/38] process-referral (레퍼럴 처리)
call npx supabase functions deploy process-referral --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [38/38] get-share-reward-status (리워드 상태 조회)
call npx supabase functions deploy get-share-reward-status --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 스테이징 배포 완료! (38개 함수)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📌 --no-verify-jwt 적용된 함수 (11개):
echo    - generate-saju-answer (내부 호출)
echo    - generate-tarot-answer (내부 호출)
echo    - send-alimtalk (내부 호출)
echo    - generate-weekly-report (내부 호출)
echo    - send-report-alimtalk (내부 호출)
echo    - generate-weekly-reports-batch (pg_cron)
echo    - cleanup-unconfirmed-tags (pg_cron)
echo    - payment-webhook (PortOne 콜백)
echo    - sentry-slack-webhook (Sentry 콜백)
echo    - generate-sitemap (Google 크롤러)
echo    - get-manse-data (비로그인 공개 접근)
echo.
goto :end

:error
echo.
echo ❌ 배포 중 오류가 발생했습니다!
echo.
exit /b 1

:end
pause
