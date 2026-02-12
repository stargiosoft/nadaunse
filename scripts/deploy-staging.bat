@echo off
chcp 65001 > nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🧪 나다운세 스테이징 Edge Functions 배포
echo    Project: hyltbeewxaqashyivilu (Staging)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set PROJECT_REF=hyltbeewxaqashyivilu

echo.
echo [1/26] generate-content-answers (진입점)
call npx supabase functions deploy generate-content-answers --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [2/26] generate-saju-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [3/26] generate-tarot-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-tarot-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [4/26] send-alimtalk (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy send-alimtalk --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [5/26] generate-free-preview
call npx supabase functions deploy generate-free-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [6/26] extract-trait-tags
call npx supabase functions deploy extract-trait-tags --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [7/26] generate-saju-preview
call npx supabase functions deploy generate-saju-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [8/26] generate-tarot-preview
call npx supabase functions deploy generate-tarot-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [9/26] generate-master-content
call npx supabase functions deploy generate-master-content --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [10/26] generate-image-prompt
call npx supabase functions deploy generate-image-prompt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [11/26] generate-thumbnail
call npx supabase functions deploy generate-thumbnail --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [12/26] generate-sitemap (--no-verify-jwt)
call npx supabase functions deploy generate-sitemap --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [13/26] generate-weekly-report
call npx supabase functions deploy generate-weekly-report --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [14/26] generate-weekly-reports-batch
call npx supabase functions deploy generate-weekly-reports-batch --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [15/26] get-available-coupons
call npx supabase functions deploy get-available-coupons --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [16/26] apply-coupon-to-order
call npx supabase functions deploy apply-coupon-to-order --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [17/26] issue-welcome-coupon
call npx supabase functions deploy issue-welcome-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [18/26] issue-revisit-coupon
call npx supabase functions deploy issue-revisit-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [19/26] payment-webhook
call npx supabase functions deploy payment-webhook --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [20/26] process-payment
call npx supabase functions deploy process-payment --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [21/26] process-refund
call npx supabase functions deploy process-refund --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [22/26] send-report-alimtalk
call npx supabase functions deploy send-report-alimtalk --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [23/26] sentry-slack-webhook
call npx supabase functions deploy sentry-slack-webhook --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [24/26] users
call npx supabase functions deploy users --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [25/26] cleanup-unconfirmed-tags (pg_cron + DEV 버튼용)
call npx supabase functions deploy cleanup-unconfirmed-tags --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [26/27] trigger-rebuild
call npx supabase functions deploy trigger-rebuild --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [27/27] index-now
call npx supabase functions deploy index-now --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 스테이징 배포 완료! (27개 함수)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📌 --no-verify-jwt 적용된 함수:
echo    - generate-saju-answer
echo    - generate-tarot-answer
echo    - send-alimtalk
echo.
goto :end

:error
echo.
echo ❌ 배포 중 오류가 발생했습니다!
echo.
exit /b 1

:end
pause
