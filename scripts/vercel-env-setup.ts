/**
 * Vercel 환경변수 자동 설정 스크립트
 */

import { chromium } from '@playwright/test';

const ENV_VARS = [
  {
    name: 'VITE_KAKAO_AUTH_SECRET',
    value: '', // 보안상 직접 입력 필요 (절대 하드코딩 금지)
    environments: ['production', 'preview', 'development'],
  },
  {
    name: 'VITE_SENTRY_DSN',
    value: '', // 사용자가 입력해야 함
    environments: ['production'],
  },
];

async function main() {
  console.log('🚀 Vercel 환경변수 설정 시작\n');

  // 브라우저 실행 (사용자 프로필 사용)
  const browser = await chromium.launchPersistentContext(
    'C:\\Users\\gksru\\AppData\\Local\\Google\\Chrome\\User Data',
    {
      headless: false,
      channel: 'chrome',
      args: ['--profile-directory=Default'],
      viewport: { width: 1280, height: 800 },
    }
  );

  const page = await browser.newPage();

  // Vercel 환경변수 페이지로 이동
  const vercelUrl = 'https://vercel.com/stargiosofts-projects/nadaunse/settings/environment-variables';
  console.log(`📍 접속: ${vercelUrl}\n`);

  await page.goto(vercelUrl, { waitUntil: 'networkidle' });

  console.log('✅ 페이지 로드 완료');
  console.log('📋 브라우저에서 직접 환경변수를 추가해주세요:\n');

  ENV_VARS.forEach((env, i) => {
    console.log(`${i + 1}. ${env.name}`);
    console.log(`   값: ${env.value || '(직접 입력 필요)'}`);
    console.log(`   환경: ${env.environments.join(', ')}\n`);
  });

  console.log('⏳ 설정 완료 후 브라우저를 닫아주세요...\n');

  // 브라우저가 닫힐 때까지 대기
  await new Promise((resolve) => {
    browser.on('close', resolve);
  });

  console.log('👋 완료!');
}

main().catch(console.error);
