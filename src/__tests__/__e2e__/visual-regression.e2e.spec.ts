import { test, expect } from '@playwright/test';

import {
  clearAllEvents,
  getCurrentDateString,
  getDateString,
  saveSchedule,
  waitForPageLoad,
} from './helpers';

test.describe('시각적 회귀 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllEvents(page);
    await waitForPageLoad(page);
  });

  test('1. 타입에 따른 캘린더 뷰 렌더링', async ({ page }) => {
    const testDate = getCurrentDateString();
    await saveSchedule(page, {
      title: '뷰 렌더링 테스트',
      date: testDate,
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
      description: '뷰 렌더링 테스트',
      location: '테스트 장소',
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    // 월별 뷰 스크린샷
    await expect(page).toHaveScreenshot('month-view.png');

    // 주별 뷰로 변경하고 스크린샷
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();
    await expect(page.getByTestId('week-view')).toBeVisible();
    await expect(page).toHaveScreenshot('week-view.png');

    // 일별 뷰로 변경하고 스크린샷
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'day-option' }).click();
    await expect(page.getByTestId('day-view')).toBeVisible();
    await expect(page).toHaveScreenshot('day-view.png');
  });

  test('2. 일정 상태별 시각적 표현 (카테고리 색상)', async ({ page }) => {
    const testDate = getCurrentDateString();
    await saveSchedule(page, {
      title: '업무 일정',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      category: '업무',
      description: '업무',
      location: '사무실',
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    await saveSchedule(page, {
      title: '개인 일정',
      date: testDate,
      startTime: '12:00',
      endTime: '13:00',
      category: '개인',
      description: '개인',
      location: '집',
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    await saveSchedule(page, {
      title: '가족 일정',
      date: testDate,
      startTime: '15:00',
      endTime: '16:00',
      category: '가족',
      description: '가족',
      location: '공원',
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    // 다른 카테고리의 일정들이 색상으로 구분되는지 스크린샷 확인
    await expect(page.getByTestId('month-view')).toBeVisible();
    await expect(page).toHaveScreenshot('event-category-colors.png');
  });

  test('3. 다이얼로그 및 모달', async ({ page }) => {
    // 일정 추가 폼(패널) 스크린샷
    await expect(page.getByTestId('event-form-panel')).toBeVisible();
    await expect(page).toHaveScreenshot('event-form-panel.png');

    // 반복 일정 설정 시 나타나는 다이얼로그 스크린샷
    await saveSchedule(page, {
      title: '반복 일정',
      date: getCurrentDateString(),
      startTime: '10:00',
      endTime: '11:00',
      category: '업무',
      description: '반복',
      location: '회의실',
      repeat: {
        type: 'daily',
        interval: 1,
        endDate: getDateString(7),
      },
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    // 생성된 반복 일정 중 하나를 클릭하여 수정
    await page.getByText('반복 일정').first().click();
    await page.getByLabel('Edit event').first().click();

    // 수정 시 나타나는 다이얼로그 스크린샷
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('recurring-event-dialog.png');
  });

  test('4. 폼 컨트롤 상태 (에러 상태)', async ({ page }) => {
    // 유효하지 않은 시간 입력
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').fill('09:00'); // 시작 시간보다 빠름
    await page.getByLabel('제목').click(); // 포커스 아웃으로 유효성 검사 트리거

    // 에러 메시지가 포함된 폼 스크린샷
    await expect(page.getByText('종료 시간은 시작 시간보다 빨라야 합니다.')).toBeVisible();
    await expect(page.getByTestId('event-form-panel')).toHaveScreenshot('form-error-state.png');
  });

  test('5. 각 셀 텍스트 길이에 따른 처리', async ({ page }) => {
    const testDate = getCurrentDateString();
    await saveSchedule(page, {
      title: '아주 아주 아주 아주 아주 아주 아주 긴 제목의 일정입니다. 텍스트가 어떻게 처리되는지 확인합니다.',
      date: testDate,
      startTime: '14:00',
      endTime: '15:00',
      category: '기타',
      description: '긴 제목 테스트',
      location: '어딘가',
    });
    await page.waitForSelector('text=일정이 추가되었습니다');

    // 긴 제목이 달력과 이벤트 리스트에서 어떻게 보이는지 스크린샷
    await expect(page).toHaveScreenshot('long-text-handling.png');
  });
});
