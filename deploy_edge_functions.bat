@echo off
set SUPABASE_ACCESS_TOKEN=sbp_0c65992cd94335205a508844ecb4faa4195c603e

echo === Deploying to Staging ===
echo Deploying generate-content-answers...
cd /d "C:\Users\gksru\나다운세 원본"
call npx supabase functions deploy generate-content-answers --project-ref hyltbeewxaqashyivilu

echo Deploying generate-saju-answer...
call npx supabase functions deploy generate-saju-answer --project-ref hyltbeewxaqashyivilu

echo === Deploying to Production ===
echo Deploying generate-content-answers...
call npx supabase functions deploy generate-content-answers --project-ref kcthtpmxffppfbkjjkub

echo Deploying generate-saju-answer...
call npx supabase functions deploy generate-saju-answer --project-ref kcthtpmxffppfbkjjkub

echo === Deployment Complete ===
pause
