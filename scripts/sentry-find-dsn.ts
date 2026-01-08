import { chromium } from '@playwright/test';

async function main() {
  console.log('🔍 Sentry DSN 찾기 시작\n');

  // 기존 Chrome 프로필 사용 (Google 로그인 유지)
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

  // Sentry 프로젝트 설정 페이지로 이동 (DSN 위치)
  await page.goto('https://sentry.io/', { waitUntil: 'networkidle' });

  console.log('📍 Sentry 페이지 열림');
  console.log('\n📋 DSN 찾기 경로:');
  console.log('   1. 프로젝트 선택 (nadaunse)');
  console.log('   2. Settings > Projects > nadaunse');
  console.log('   3. Client Keys (DSN) 메뉴 클릭');
  console.log('   4. DSN 값 복사\n');
  console.log('⏳ DSN을 찾은 후 브라우저를 닫아주세요...\n');

  // 브라우저가 닫힐 때까지 대기
  await new Promise((resolve) => {
    browser.on('close', resolve);
  });
}

main().catch(console.error);
