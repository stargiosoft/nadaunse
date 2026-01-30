@echo off
chcp 65001 > nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🧪 나다운세 스테이징 Edge Functions 배포
echo    Project: hyltbeewxaqashyivilu (Staging)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set PROJECT_REF=hyltbeewxaqashyivilu

echo.
echo [1/24] generate-content-answers (진입점)
call npx supabase functions deploy generate-content-answers --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [2/24] generate-saju-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [3/24] generate-tarot-answer (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy generate-tarot-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [4/24] send-alimtalk (--no-verify-jwt, 내부 호출용)
call npx supabase functions deploy send-alimtalk --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [5/24] generate-free-preview
call npx supabase functions deploy generate-free-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [6/24] extract-trait-tags
call npx supabase functions deploy extract-trait-tags --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [7/24] generate-saju-preview
call npx supabase functions deploy generate-saju-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [8/24] generate-tarot-preview
call npx supabase functions deploy generate-tarot-preview --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [9/24] generate-master-content
call npx supabase functions deploy generate-master-content --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [10/24] generate-image-prompt
call npx supabase functions deploy generate-image-prompt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [11/24] generate-thumbnail
call npx supabase functions deploy generate-thumbnail --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [12/24] generate-sitemap
call npx supabase functions deploy generate-sitemap --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [13/24] generate-weekly-report
call npx supabase functions deploy generate-weekly-report --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [14/24] generate-weekly-reports-batch
call npx supabase functions deploy generate-weekly-reports-batch --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [15/24] get-available-coupons
call npx supabase functions deploy get-available-coupons --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [16/24] apply-coupon-to-order
call npx supabase functions deploy apply-coupon-to-order --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [17/24] issue-welcome-coupon
call npx supabase functions deploy issue-welcome-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [18/24] issue-revisit-coupon
call npx supabase functions deploy issue-revisit-coupon --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [19/24] payment-webhook
call npx supabase functions deploy payment-webhook --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [20/24] process-payment
call npx supabase functions deploy process-payment --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [21/24] process-refund
call npx supabase functions deploy process-refund --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [22/24] send-report-alimtalk
call npx supabase functions deploy send-report-alimtalk --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [23/24] sentry-slack-webhook
call npx supabase functions deploy sentry-slack-webhook --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [24/24] users
call npx supabase functions deploy users --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ 스테이징 배포 완료! (24개 함수)
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
