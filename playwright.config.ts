import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 1. 테스트 파일이 위치할 디렉토리
  testDir: './src/__e2e__',

  // 2. 타임아웃 설정 (넉넉하게)
  timeout: 60 * 1000, // 60초

  // 3. 테스트 대상 URL (Vite 개발 서버 주소)
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },

  // 4. (가장 중요) E2E 테스트를 위한 서버 동시 실행
  webServer: [
    {
      // [서버 1: Mock API 서버 (server.js)]
      // E2E용 DB를 사용하도록 환경변수 설정
      command: 'TEST_ENV=e2e node server.js',
      url: 'http://localhost:3000', // server.js가 실행되는 주소
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // [서버 2: Vite 개발 서버 (pnpm dev)]
      command: 'pnpm dev', // 이 명령어가 Vite 서버(5173)를 실행
      url: 'http://localhost:5174', // baseURL과 일치
      reuseExistingServer: true,
    },
  ],

  // (필요시 브라우저 설정)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
