import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/__e2e__',

  /* 테스트 격리를 위해 순차 실행 (e2e.json 공유로 인한 race condition 방지) */
  fullyParallel: false,

  /* CI 환경에서만 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,

  /* 단일 워커로 실행하여 DB 충돌 방지 */
  workers: 1,

  /* 리포터 설정 */
  reporter: 'html',

  /* 모든 테스트에 적용되는 공통 설정 */
  use: {
    /* 베이스 URL */
    baseURL: 'http://localhost:5173',

    /* 실패 시 스크린샷 저장 */
    screenshot: 'only-on-failure',

    /* 실패 시 비디오 저장 */
    video: 'retain-on-failure',

    /* 실패 시 trace 저장 */
    trace: 'on-first-retry',
  },

  /* 테스트 실행 전 서버 시작 설정 */
  webServer: [
    {
      /* API 서버: E2E 모드로 실행 */
      command: 'TEST_ENV=e2e node server.js',
      url: 'http://localhost:3000/api/events',
      reuseExistingServer: !process.env.CI,
      env: {
        TEST_ENV: 'e2e',
      },
    },
    {
      /* Vite 개발 서버 */
      command: 'pnpm start',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],

  /* 다양한 브라우저에서 테스트 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
