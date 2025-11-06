import { test, expect } from '@playwright/test';

import {
  clearAllEvents,
  getCurrentDateString,
  getDateString,
  saveSchedule,
  waitForPageLoad,
} from './helpers';

/**

 * @name 기본 일정 관리 워크플로우 E2E 테스트

 * @description 기본 일정의 생성(Create), 조회(Read), 수정(Update), 삭제(Delete) 전반을 검증하는 E2E 테스트

 */

test.describe('기본 일정 관리 워크플로우 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 데이터 초기화 (모든 이벤트 삭제)
    await clearAllEvents(page);
    await waitForPageLoad(page);
  });

  test('일정을 생성하고 이벤트 리스트와 달력에 표시되는지 확인한다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성 (달력이 현재 날짜를 표시하므로)
    const testDate = getCurrentDateString();

    // 일정 생성
    await saveSchedule(page, {
      title: '새 회의',
      date: testDate,
      startTime: '09:30',
      endTime: '10:30',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 이벤트 리스트에 표시되는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('새 회의')).toBeVisible();
    await expect(eventList.getByText(testDate)).toBeVisible();
    await expect(eventList.getByText('09:30 - 10:30')).toBeVisible();
    await expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeVisible();
    await expect(eventList.getByText('회의실 A')).toBeVisible();
    await expect(eventList.getByText('카테고리: 업무')).toBeVisible();

    // 달력(월별 뷰)에 표시되는지 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^새 회의/')).toBeVisible();
  });

  test('생성된 일정이 이벤트 리스트와 달력에서 정확히 조회되는지 확인한다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 일정 생성
    await saveSchedule(page, {
      title: '조회 테스트 회의',
      date: testDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '조회 테스트용 회의',
      location: '회의실 B',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 이벤트 리스트에서 모든 필드가 정확히 표시되는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('조회 테스트 회의')).toBeVisible();
    await expect(eventList.getByText(testDate)).toBeVisible();
    await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();
    await expect(eventList.getByText('조회 테스트용 회의')).toBeVisible();
    await expect(eventList.getByText('회의실 B')).toBeVisible();
    await expect(eventList.getByText('카테고리: 개인')).toBeVisible();

    // 달력(월별 뷰)에서 일정이 표시되는지 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^조회 테스트 회의/')).toBeVisible();

    // 주별 뷰 전환 후에도 표시되는지 확인
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();
    const weekView = page.getByTestId('week-view');

    await expect(weekView.locator('text=/^조회 테스트 회의/')).toBeVisible();
  });

  test('일정을 수정하고 변경사항이 이벤트 리스트와 달력에 반영되는지 확인한다', async ({
    page,
  }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();
    const modifiedDate = getDateString(1); // 다음 날

    // 먼저 일정 생성
    await saveSchedule(page, {
      title: '기존 회의',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });
    // 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 일정 정보 수정
    await page.getByLabel('제목').clear();
    await page.getByLabel('제목').fill('수정된 회의');
    await page.getByLabel('설명').clear();
    await page.getByLabel('설명').fill('회의 내용 변경');
    await page.getByLabel('날짜').clear();
    await page.getByLabel('날짜').fill(modifiedDate);

    // 수정 완료
    await page.getByTestId('event-submit-button').click();
    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible({ timeout: 5000 });

    // 이벤트 리스트에 변경사항 반영 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('수정된 회의')).toBeVisible();
    await expect(eventList.getByText('회의 내용 변경')).toBeVisible();
    await expect(eventList.getByText(modifiedDate)).toBeVisible();

    // 달력에 변경사항 반영 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^수정된 회의/')).toBeVisible();
  });

  test('일정을 삭제하고 이벤트 리스트와 달력에서 제거되는지 확인한다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 먼저 일정 생성
    await saveSchedule(page, {
      title: '삭제할 이벤트',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '삭제 주석 입니다',
      location: '어딘가',
      category: '기타',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 삭제할 일정이 이벤트 리스트에 있는지 확인
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('삭제할 이벤트')).toBeVisible();

    // 달력에 일정이 표시되는지 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^삭제할 이벤트/')).toBeVisible();

    // 삭제 버튼 클릭
    const deleteButton = page.getByLabel('Delete event').first();
    await deleteButton.click();

    // 삭제 완료 메시지 확인
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible({ timeout: 5000 });

    // 이벤트 리스트에서 제거 확인
    await expect(eventList.getByText('삭제할 이벤트')).not.toBeVisible();

    // 달력에서 제거 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    await expect(monthView.locator('text=/^삭제할 이벤트/')).not.toBeVisible();
  });

  test('생성된 일정이 검색 결과에 표시되는지 확인한다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 일정 생성
    await saveSchedule(page, {
      title: '검색 테스트 회의',
      date: testDate,
      startTime: '11:00',
      endTime: '12:00',
      description: '검색 테스트용 회의',
      location: '회의실 C',
      category: '가족',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 일정이 리스트에 나타날 때까지 대기
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('검색 테스트 회의')).toBeVisible();

    // 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('검색 테스트');

    // 검색 결과에 일정이 표시되는지 확인
    await expect(eventList.getByText('검색 테스트 회의')).toBeVisible();
    await expect(eventList.getByText('검색 테스트용 회의')).toBeVisible();

    // 검색어를 지우면 모든 일정이 다시 표시되는지 확인
    await searchInput.clear();
    await expect(eventList.getByText('검색 테스트 회의')).toBeVisible();
  });
});
