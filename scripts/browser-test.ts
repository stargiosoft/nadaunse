/**
 * Playwright 브라우저 테스트 스크립트
 * 실행: npx ts-node scripts/browser-test.ts
 */

import { chromium } from '@playwright/test';

async function main() {
  // 브라우저 실행 (headless: false = 화면 표시)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // 동작 간 500ms 대기 (디버깅용)
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro 크기
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  // 콘솔 로그 출력
  page.on('console', msg => {
    console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
  });

  // 네트워크 요청 로깅
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log(`[Request] ${request.method()} ${request.url()}`);
    }
  });

  // 페이지 접속
  const targetUrl = process.env.TARGET_URL || 'https://nadaunse-git-develop-stargiosofts-projects.vercel.app';
  console.log(`\n🌐 접속 URL: ${targetUrl}\n`);

  await page.goto(targetUrl);
  console.log('✅ 페이지 로드 완료');

  // 브라우저가 닫힐 때까지 대기 (수동 테스트용)
  console.log('\n⏳ 브라우저를 수동으로 닫으면 스크립트가 종료됩니다...\n');

  // 브라우저가 닫힐 때까지 대기
  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
  });

  console.log('👋 브라우저 종료됨');
}

main().catch(console.error);
