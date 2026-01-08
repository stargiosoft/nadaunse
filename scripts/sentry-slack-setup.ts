/**
 * Sentry Slack 알림 설정 - 실제 Chrome 사용
 */

import { chromium } from '@playwright/test';

const SLACK_CHANNEL = 'bug_스타지오';

async function main() {
  console.log('🔧 Sentry Slack 알림 설정 시작\n');

  // 실제 Chrome 브라우저 + 기존 프로필 사용
  const browser = await chromium.launchPersistentContext(
    'C:\\Users\\gksru\\AppData\\Local\\Google\\Chrome\\User Data',
    {
      headless: false,
      channel: 'chrome',
      args: ['--profile-directory=Default'],
      viewport: { width: 1280, height: 900 },
      slowMo: 300,
    }
  );

  const page = await browser.newPage();

  try {
    // 1. Sentry 알림 생성 페이지로 이동
    console.log('📍 Sentry 알림 설정 페이지 이동...');
    await page.goto('https://sentry.io/alerts/new/issue/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // 2. 프로젝트 선택
    console.log('📋 프로젝트 선택...');
    const projectSelector = page.locator('[data-test-id="project-select"]').first();
    if (await projectSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectSelector.click();
      await page.waitForTimeout(500);
      const projectOption = page.locator('text=nadaunse').first();
      if (await projectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await projectOption.click();
      }
    }

    await page.waitForTimeout(1000);

    // 3. 알림 이름 입력
    console.log('✏️ 알림 이름 입력...');
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill('Nadaunse Error Alert - Slack');
    }

    // 4. Slack 액션 추가
    console.log('📱 Slack 알림 액션 추가...');
    const addActionBtn = page.locator('button:has-text("Add action")').first();
    if (await addActionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addActionBtn.click();
      await page.waitForTimeout(1000);

      // Slack 옵션 선택
      const slackOption = page.locator('text=Send a Slack notification').first();
      if (await slackOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await slackOption.click();
        await page.waitForTimeout(1500);
      }
    }

    // 5. Slack 채널 입력
    console.log(`📢 Slack 채널: #${SLACK_CHANNEL}`);
    const channelInput = page.locator('input[placeholder*="channel"], input[name*="channel"]').first();
    if (await channelInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await channelInput.fill(SLACK_CHANNEL);
    }

    console.log('\n✅ 자동 설정 완료!');
    console.log('👉 설정 확인 후 "Save Rule" 클릭하세요.');
    console.log('⏳ 브라우저를 닫으면 스크립트가 종료됩니다...\n');

    await new Promise((resolve) => {
      browser.on('close', resolve);
    });

    console.log('👋 완료!');

  } catch (error) {
    console.error('❌ 에러:', error);
    console.log('\n👉 브라우저에서 직접 완료해주세요.');

    await new Promise((resolve) => {
      browser.on('close', resolve);
    });
  }
}

main().catch(console.error);
