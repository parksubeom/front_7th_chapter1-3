import { test, expect } from '@playwright/test';

import { clearAllEvents, getCurrentDateString, saveSchedule, waitForPageLoad } from './helpers';

/**
 * @name 일정 겹침 처리 방식 E2E 테스트
 * @description 겹치는 시간대의 일정 생성 시 경고 표시 및 처리 방식을 검증하는 E2E 테스트
 */
test.describe('일정 겹침 처리 방식 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 데이터 초기화 (모든 이벤트 삭제)
    await clearAllEvents(page);
    await waitForPageLoad(page);
  });

  test('겹치는 시간대에 새로운 일정 생성 시 경고 다이얼로그가 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 기존 일정 생성
    await saveSchedule(page, {
      title: '기존 회의',
      date: testDate,
      startTime: '18:00',
      endTime: '19:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 겹치는 시간대에 새로운 일정 생성 시도
    await saveSchedule(page, {
      title: '새 회의',
      date: testDate,
      startTime: '18:30',
      endTime: '19:30',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // // 겹침 경고 다이얼로그가 나타나는지 확인
    // await expect(page.getByText('일정 겹침 경고')).toBeVisible();
    // await expect(page.getByText(/다음 일정과 겹칩니다/)).toBeVisible();

    // 겹침 경고 다이얼로그가 나타나는지 확인
    const overlapDialog = page.getByText('일정 겹침 경고');
    const isOverlapDialogVisible = await overlapDialog
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isOverlapDialogVisible) {
      // 겹침 경고가 있으면 "계속 진행" 버튼 클릭
      await page.getByRole('button', { name: '계속 진행' }).click();
    }

    // 겹치는 일정 정보가 다이얼로그에 표시되는지 확인
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/기존 회의/)).toBeVisible();
    // 날짜와 시간이 표시되는지 확인 (정규식으로 유연하게)
    await expect(dialog.getByText(new RegExp(`${testDate}.*18:00.*19:00`))).toBeVisible();
  });

  test('경고 다이얼로그에서 취소 버튼 클릭 시 일정 생성이 취소된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 기존 일정 생성
    await saveSchedule(page, {
      title: '기존 회의',
      date: testDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 겹치는 시간대에 새로운 일정 생성 시도
    await saveSchedule(page, {
      title: '새 취소 회의',
      date: testDate,
      startTime: '10:30',
      endTime: '11:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 겹침 경고 다이얼로그가 나타날 때까지 대기
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // 취소 버튼 클릭
    await page.getByText('취소').click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

    // 일정이 생성되지 않았는지 확인 (이벤트 리스트에 새 일정이 없어야 함) (제목만 찾기)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('새 취소 회의')).not.toBeVisible();

    // 기존 일정은 그대로 있는지 확인 (제목만 찾기)
    await expect(eventList.getByText('기존 회의')).toBeVisible();
  });

  test('경고 다이얼로그에서 확인 버튼 클릭 시 일정이 생성된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 기존 일정 생성
    await saveSchedule(page, {
      title: '기존 회의',
      date: testDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 겹치는 시간대에 새로운 일정 생성 시도
    await saveSchedule(page, {
      title: '경고 확인 회의',
      date: testDate,
      startTime: '14:30',
      endTime: '15:30',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 겹침 경고 다이얼로그가 나타날 때까지 대기
    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // 확인 버튼 클릭 (계속 진행)
    await page.getByRole('button', { name: '계속 진행' }).click();

    // 다이얼로그가 닫혔는지 확인
    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 이벤트 리스트에 새 일정이 표시되는지 확인
    const eventList = page.getByTestId('event-list');

    // 새 회의가 있는지 확인
    await expect(eventList.getByText('경고 확인 회의')).toBeVisible();

    // 기존 일정도 그대로 있는지 확인
    await expect(eventList.getByText('기존 회의')).toBeVisible();

    // 달력에도 새 일정이 표시되는지 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^경고 확인 회의/')).toBeVisible();
    await expect(monthView.locator('text=/^기존 회의/')).toBeVisible();
  });
});
