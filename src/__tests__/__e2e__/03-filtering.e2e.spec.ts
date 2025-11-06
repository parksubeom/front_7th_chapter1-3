import { test, expect } from '@playwright/test';

import {
  clearAllEvents,
  getCurrentDateString,
  getDateString,
  saveSchedule,
  waitForPageLoad,
} from './helpers';

/**
 * @name 검색 및 필터링 전반 E2E 테스트
 * @description 검색어 입력, 검색 결과 필터링, 검색 결과 없을 때 처리, 검색어 삭제 시 전체 일정 표시를 검증하는 E2E 테스트
 */
test.describe('검색 및 필터링 전반 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 데이터 초기화 (모든 이벤트 삭제)
    await clearAllEvents(page);
    await waitForPageLoad(page);
  });

  test('검색어 입력 시 제목에 일치하는 일정만 필터링되어 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 첫 번째 일정 생성
    await saveSchedule(page, {
      title: '프로젝트 회의',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 두 번째 일정 생성
    await saveSchedule(page, {
      title: '점심 약속',
      date: testDate,
      startTime: '12:00',
      endTime: '13:00',
      description: '친구와 점심 식사',
      location: '레스토랑',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 검색어 입력 전 모든 일정 확인 (제목만 찾기)
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).toBeVisible();

    // 검색어 입력 (제목으로 검색)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('프로젝트');

    // 검색 결과 확인: '프로젝트 회의'만 표시되어야 함 (제목만 찾기)
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();

    // 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^프로젝트 회의/')).toBeVisible();
    await expect(monthView.locator('text=/^점심 약속/')).not.toBeVisible();
  });

  test('검색어 입력 시 설명에 일치하는 일정만 필터링되어 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 첫 번째 일정 생성
    await saveSchedule(page, {
      title: '팀 미팅',
      date: testDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 두 번째 일정 생성
    await saveSchedule(page, {
      title: '개인 일정',
      date: testDate,
      startTime: '16:00',
      endTime: '17:00',
      description: '친구와 점심 식사',
      location: '카페',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 미팅')).toBeVisible();
    await expect(eventList.getByText('개인 일정')).toBeVisible();

    // 검색어 입력 (설명으로 검색)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('점심');

    // 검색 결과 확인: '개인 일정'만 표시되어야 함 (설명에 '점심'이 포함됨) (제목만 찾기)
    await expect(eventList.getByText('개인 일정')).toBeVisible();
    await expect(eventList.getByText('팀 미팅')).not.toBeVisible();

    // 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^개인 일정/')).toBeVisible();
    await expect(monthView.locator('text=/^팀 미팅/')).not.toBeVisible();
  });

  test('검색어 입력 시 위치에 일치하는 일정만 필터링되어 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 첫 번째 일정 생성
    await saveSchedule(page, {
      title: '회의',
      date: testDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 두 번째 일정 생성
    await saveSchedule(page, {
      title: '약속',
      date: testDate,
      startTime: '13:00',
      endTime: '14:00',
      description: '친구 만남',
      location: '카페',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('회의', { exact: true })).toBeVisible();
    await expect(eventList.getByText('약속', { exact: true })).toBeVisible();

    // 검색어 입력 (위치로 검색)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('회의실');

    // 검색 결과 확인: '회의'만 표시되어야 함
    await expect(eventList.getByText('회의', { exact: true })).toBeVisible();
    await expect(eventList.getByText('약속', { exact: true })).not.toBeVisible();

    // 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^회의/')).toBeVisible();
    await expect(monthView.locator('text=/^약속/')).not.toBeVisible();
  });

  test('검색 결과가 없을 때 적절한 메시지나 빈 상태가 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 일정 생성
    await saveSchedule(page, {
      title: '회의',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('회의', { exact: true })).toBeVisible();

    // 존재하지 않는 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('존재하지않는일정');

    // 검색 결과가 없는 경우: 일정이 리스트에서 사라져야 함 (제목만 찾기)
    await expect(eventList.getByText('회의', { exact: true })).not.toBeVisible();

    // 검색 결과 없음 메시지 확인
    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();

    // 달력에서도 검색 결과가 없어야 함 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^회의/')).not.toBeVisible();
  });

  test('검색어를 삭제하면 모든 일정이 다시 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 첫 번째 일정 생성
    await saveSchedule(page, {
      title: '프로젝트 회의',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 두 번째 일정 생성
    await saveSchedule(page, {
      title: '점심 약속',
      date: testDate,
      startTime: '12:00',
      endTime: '13:00',
      description: '친구와 점심 식사',
      location: '레스토랑',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).toBeVisible();

    // 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('프로젝트');

    // 검색 결과 확인: '프로젝트 회의'만 표시 (제목만 찾기)
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).not.toBeVisible();

    // 검색어 삭제
    await searchInput.clear();

    // 모든 일정이 다시 표시되는지 확인 (제목만 찾기)
    await expect(eventList.getByText('프로젝트 회의')).toBeVisible();
    await expect(eventList.getByText('점심 약속')).toBeVisible();

    // 달력에서도 모든 일정이 다시 표시되는지 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^프로젝트 회의/')).toBeVisible();
    await expect(monthView.locator('text=/^점심 약속/')).toBeVisible();
  });

  test('검색어 입력 시 주간 뷰에서도 검색 결과가 올바르게 필터링된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();
    const otherWeekDate = getDateString(10); // 현재 날짜에서 10일 후 (다른 주)

    // 주간 뷰에 해당하는 일정 생성
    await saveSchedule(page, {
      title: '주간 회의',
      date: testDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 미팅',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 주간 뷰에 해당하지 않는 일정 생성 (다른 주)
    await saveSchedule(page, {
      title: '다른 주 회의',
      date: otherWeekDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '다른 주 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 주별 뷰로 전환
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();

    const weekView = page.getByTestId('week-view');
    const eventList = page.getByTestId('event-list');

    // 주간 뷰에서는 현재 주의 일정만 표시되어야 함 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    await expect(weekView.locator('text=/^주간 회의/')).toBeVisible();
    await expect(eventList.getByText('주간 회의')).toBeVisible();

    // 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('주간');

    // 검색 결과 확인: 주간 뷰에 해당하는 일정만 검색 결과에 표시 (제목만 찾기)
    await expect(eventList.getByText('주간 회의')).toBeVisible();
    await expect(eventList.getByText('다른 주 회의')).not.toBeVisible();

    // 주간 뷰 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    await expect(weekView.locator('text=/^주간 회의/')).toBeVisible();
    await expect(weekView.locator('text=/^다른 주 회의/')).not.toBeVisible();
  });

  test('검색어 입력 시 월간 뷰에서도 검색 결과가 올바르게 필터링된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();
    const nextMonthDate = getDateString(30); // 현재 날짜에서 30일 후 (다음 달)

    // 현재 월의 일정 생성
    await saveSchedule(page, {
      title: '10월 회의',
      date: testDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '10월 미팅',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 다른 월의 일정 생성
    await saveSchedule(page, {
      title: '11월 회의',
      date: nextMonthDate,
      startTime: '10:00',
      endTime: '11:00',
      description: '11월 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const monthView = page.getByTestId('month-view');
    const eventList = page.getByTestId('event-list');

    // 월간 뷰에서는 현재 월의 일정만 표시되어야 함 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    await expect(monthView.locator('text=/^10월 회의/')).toBeVisible();
    await expect(eventList.getByText('10월 회의')).toBeVisible();

    // 검색어 입력
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('10월');

    // 검색 결과 확인: 월간 뷰에 해당하는 일정만 검색 결과에 표시 (제목만 찾기)
    await expect(eventList.getByText('10월 회의')).toBeVisible();
    await expect(eventList.getByText('11월 회의')).not.toBeVisible();

    // 월간 뷰 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    await expect(monthView.locator('text=/^10월 회의/')).toBeVisible();
    await expect(monthView.locator('text=/^11월 회의/')).not.toBeVisible();
  });

  test('여러 일정 중 일부만 검색어에 일치하는 경우 해당 일정만 표시된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const testDate = getCurrentDateString();

    // 여러 일정 생성
    await saveSchedule(page, {
      title: '프로젝트 회의',
      date: testDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    await saveSchedule(page, {
      title: '점심 약속',
      date: testDate,
      startTime: '12:00',
      endTime: '13:00',
      description: '친구와 점심 식사',
      location: '레스토랑',
      category: '개인',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    await saveSchedule(page, {
      title: '팀 미팅',
      date: testDate,
      startTime: '15:00',
      endTime: '16:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    const eventList = page.getByTestId('event-list');

    // 모든 일정이 표시되는지 확인 (제목만 찾기)
    await expect(eventList.getByText('프로젝트 회의', { exact: true })).toBeVisible();
    await expect(eventList.getByText('점심 약속', { exact: true })).toBeVisible();
    await expect(eventList.getByText('팀 미팅', { exact: true })).toBeVisible();

    // 검색어 입력 (일부 일정만 일치)
    const searchInput = page.getByPlaceholder('검색어를 입력하세요');
    await searchInput.fill('점심');

    // 검색 결과 확인: '점심 약속'만 표시되어야 함 (제목만 찾기)
    await expect(eventList.getByText('점심 약속', { exact: true })).toBeVisible();
    await expect(eventList.getByText('프로젝트 회의', { exact: true })).not.toBeVisible();
    await expect(eventList.getByText('팀 미팅', { exact: true })).not.toBeVisible();

    // 달력에서도 검색 결과 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^점심 약속/')).toBeVisible();
    await expect(monthView.locator('text=/^프로젝트 회의/')).not.toBeVisible();
    await expect(monthView.locator('text=/^팀 미팅/')).not.toBeVisible();
  });
});
