/**
 * Sentry Slack 알림 설정 - CDP로 실제 Chrome 제어
 */

import { chromium } from '@playwright/test';

const SLACK_CHANNEL = 'bug_스타지오';

async function main() {
  console.log('🔧 Sentry Slack 알림 설정 시작\n');
  console.log('🔌 Chrome에 연결 중...');

  // 실행 중인 Chrome에 CDP로 연결
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');

  console.log('✅ Chrome 연결 성공!');

  // 기존 컨텍스트 가져오기
  const contexts = browser.contexts();
  const context = contexts[0];

  // 기존 페이지 가져오기 또는 새 페이지
  let page = context.pages()[0];
  if (!page) {
    page = await context.newPage();
  }

  try {
    // 현재 URL 확인
    console.log('📍 현재 페이지:', page.url());

    // Sentry 알림 페이지가 아니면 이동
    if (!page.url().includes('sentry.io/alerts')) {
      console.log('📍 Sentry 알림 페이지로 이동...');
      await page.goto('https://sentry.io/alerts/new/issue/', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    }

    await page.waitForTimeout(3000);
    console.log('✅ 페이지 로드 완료');

    // 알림 이름 입력
    console.log('✏️ 알림 이름 입력...');
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.click();
      await nameInput.fill('Nadaunse Error Alert - Slack');
      console.log('✅ 알림 이름 입력 완료');
    }

    await page.waitForTimeout(1000);

    // Slack 액션 추가
    console.log('📱 Slack 알림 액션 추가...');

    // "Add action" 버튼 찾기
    const addActionBtn = page.locator('button').filter({ hasText: /Add action/i }).first();
    if (await addActionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addActionBtn.click();
      await page.waitForTimeout(1500);
      console.log('✅ Add action 클릭');

      // Slack 옵션 선택
      const slackOption = page.locator('[role="menuitem"], [role="option"], button, div').filter({ hasText: /Slack/i }).first();
      if (await slackOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await slackOption.click();
        await page.waitForTimeout(2000);
        console.log('✅ Slack 선택');
      }
    }

    // 채널 입력
    console.log(`📢 채널 입력: #${SLACK_CHANNEL}`);
    const channelInput = page.locator('input').filter({ hasText: '' }).locator('visible=true');
    const inputs = await page.locator('input:visible').all();

    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      if (placeholder?.toLowerCase().includes('channel') || name?.toLowerCase().includes('channel')) {
        await input.fill(SLACK_CHANNEL);
        console.log('✅ 채널 입력 완료');
        break;
      }
    }

    console.log('\n✅ 자동 설정 완료!');
    console.log('👉 설정 확인 후 "Save Rule" 버튼을 클릭하세요.');
    console.log('\n⏳ 10초 후 스크립트 종료...');

    await page.waitForTimeout(10000);

    console.log('👋 완료!');

  } catch (error) {
    console.error('❌ 에러:', error);
    console.log('\n👉 브라우저에서 직접 완료해주세요.');
  }

  // 연결만 해제 (브라우저는 열린 상태 유지)
  await browser.close();
}

main().catch(console.error);
