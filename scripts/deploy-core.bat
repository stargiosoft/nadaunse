@echo off
chcp 65001 > nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎯 나다운세 핵심 Edge Functions만 배포 (유료 콘텐츠 관련)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 환경을 선택하세요:
echo   1. Production (kcthtpmxffppfbkjjkub)
echo   2. Staging (hyltbeewxaqashyivilu)
echo.
set /p ENV_CHOICE="선택 (1 또는 2): "

if "%ENV_CHOICE%"=="1" (
    set PROJECT_REF=kcthtpmxffppfbkjjkub
    set ENV_NAME=Production
) else if "%ENV_CHOICE%"=="2" (
    set PROJECT_REF=hyltbeewxaqashyivilu
    set ENV_NAME=Staging
) else (
    echo ❌ 잘못된 선택입니다.
    goto :end
)

echo.
echo 🚀 %ENV_NAME% 환경에 핵심 함수 배포 시작...
echo.

echo [1/4] generate-content-answers (진입점)
call npx supabase functions deploy generate-content-answers --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [2/4] generate-saju-answer (--no-verify-jwt)
call npx supabase functions deploy generate-saju-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [3/4] generate-tarot-answer (--no-verify-jwt)
call npx supabase functions deploy generate-tarot-answer --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo [4/4] send-alimtalk (--no-verify-jwt)
call npx supabase functions deploy send-alimtalk --no-verify-jwt --project-ref %PROJECT_REF%
if errorlevel 1 goto :error

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ %ENV_NAME% 핵심 함수 배포 완료! (4개 함수)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
goto :end

:error
echo.
echo ❌ 배포 중 오류가 발생했습니다!
exit /b 1

:end
pause
