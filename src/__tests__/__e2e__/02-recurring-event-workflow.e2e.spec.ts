import { test, expect } from '@playwright/test';

import {
  clearAllEvents,
  getCurrentDateString,
  getDateString,
  saveSchedule,
  waitForPageLoad,
} from './helpers';

/**
 * @name 반복 일정 관리 워크플로우 E2E 테스트
 * @description 반복 일정의 생성(Create), 조회(Read), 수정(Update), 삭제(Delete) 전반을 검증하는 E2E 테스트. 단일/전체 수정 및 삭제 옵션 포함
 */
test.describe('반복 일정 관리 워크플로우 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 데이터 초기화 (모든 이벤트 삭제)
    await clearAllEvents(page);
    await waitForPageLoad(page);
  });

  test('반복 일정을 생성하고 여러 날짜에 표시되는지 확인한다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 반복 일정 생성 (매일, 현재 날짜부터 2일 후까지)
    await saveSchedule(page, {
      title: '매일 회의',
      date: startDate,
      startTime: '09:00',
      endTime: '10:00',
      description: '매일 진행되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 이벤트 리스트에 여러 인스턴스가 표시되는지 확인
    const eventList = page.getByTestId('event-list');
    const meetingInstances = eventList.locator('text=매일 회의');
    const count = await meetingInstances.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 각 날짜별 일정이 표시되는지 확인
    await expect(eventList.getByText(startDate, { exact: true })).toBeVisible();
    await expect(eventList.getByText(getDateString(1), { exact: true })).toBeVisible();
    await expect(eventList.getByText(endDate, { exact: true })).toBeVisible();

    // 반복 아이콘이 표시되는지 확인
    const repeatIcons = page.locator('[data-testid="RepeatIcon"]');
    const iconCount = await repeatIcons.count();
    expect(iconCount).toBeGreaterThan(0);

    // 달력(월별 뷰)에 여러 날짜에 표시되는지 확인
    const monthView = page.getByTestId('month-view');
    const calendarMeetings = monthView.locator('text=매일 회의');
    const calendarCount = await calendarMeetings.count();
    expect(calendarCount).toBeGreaterThanOrEqual(2);
  });

  test('생성된 반복 일정이 이벤트 리스트와 달력에서 정확히 조회되는지 확인한다', async ({
    page,
  }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 반복 일정 생성
    await saveSchedule(page, {
      title: '조회 테스트 회의',
      date: startDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '조회 테스트용 반복 회의',
      location: '회의실 B',
      category: '개인',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 이벤트 리스트에서 모든 필드가 정확히 표시되는지 확인
    const eventList = page.getByTestId('event-list');
    const meetingInstances = eventList.locator('text=조회 테스트 회의');
    const count = await meetingInstances.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 각 인스턴스의 정보가 정확한지 확인
    await expect(eventList.getByText(startDate, { exact: true })).toBeVisible();
    await expect(eventList.getByText(getDateString(1), { exact: true })).toBeVisible();
    await expect(eventList.getByText(endDate, { exact: true })).toBeVisible();

    // 시간이 여러 개 있을 수 있으므로 확인
    const timeTexts = eventList.locator('text=14:00 - 15:00');
    const timeCount = await timeTexts.count();
    expect(timeCount).toBeGreaterThan(0);

    // 설명, 위치, 카테고리도 여러 개 있을 수 있으므로 확인
    const descriptionTexts = eventList.locator('text=조회 테스트용 반복 회의');
    const descCount = await descriptionTexts.count();
    expect(descCount).toBeGreaterThan(0);

    const locationTexts = eventList.locator('text=회의실 B');
    const locCount = await locationTexts.count();
    expect(locCount).toBeGreaterThan(0);

    const categoryTexts = eventList.locator('text=카테고리: 개인');
    const catCount = await categoryTexts.count();
    expect(catCount).toBeGreaterThan(0);

    // 달력(월별 뷰)에서 일정이 표시되는지 확인
    const monthView = page.getByTestId('month-view');
    const calendarMeetings = monthView.locator('text=조회 테스트 회의');
    const calendarCount = await calendarMeetings.count();
    expect(calendarCount).toBeGreaterThanOrEqual(2);

    // 주별 뷰 전환 후에도 표시되는지 확인
    await page.getByLabel('뷰 타입 선택').click();
    await page.getByRole('option', { name: 'week-option' }).click();

    const weekView = page.getByTestId('week-view');
    const weekMeetings = weekView.locator('text=조회 테스트 회의');
    const weekCount = await weekMeetings.count();
    expect(weekCount).toBeGreaterThanOrEqual(2);
  });

  test('반복 일정 수정 시 "예" 선택하면 해당 일정만 수정된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 먼저 반복 일정 생성
    await saveSchedule(page, {
      title: '매일 회의',
      date: startDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '매일 진행되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 반복 일정이 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    const initialMeetings = eventList.locator('text=매일 회의');
    const initialCount = await initialMeetings.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // 첫 번째 반복 일정 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 반복 일정 편집 다이얼로그가 나타나는지 확인
    await expect(page.getByText('반복 일정 수정')).toBeVisible();
    await expect(page.getByText('해당 일정만 수정하시겠어요?')).toBeVisible();

    // "예" 버튼 선택 (단일 수정)
    await page.getByText('예').click();

    // 일정 편집 폼에서 필드 채우기
    await page.getByLabel('제목').clear();
    await page.getByLabel('제목').fill('수정된 회의');

    // 수정 완료
    await page.getByTestId('event-submit-button').click();

    // 결과 확인: 한 개는 수정되고 나머지는 그대로 (제목만 찾기)
    const updatedEventList = page.getByTestId('event-list');
    await expect(updatedEventList.getByText('수정된 회의')).toBeVisible();

    // 나머지 일정은 그대로 유지되는지 확인
    const remainingMeetings = updatedEventList.locator('text=매일 회의');
    const remainingCount = await remainingMeetings.count();
    expect(remainingCount).toBeGreaterThanOrEqual(1);

    // 달력에서도 확인 (제목이 잘릴 수 있으므로 부분 매칭 사용)
    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=/^수정된 회의/')).toBeVisible();

    // 나머지 일정은 그대로 유지되는지 확인
    const remainingCalendarMeetings = monthView.locator('text=매일 회의');
    const calendarRemainingCount = await remainingCalendarMeetings.count();
    expect(calendarRemainingCount).toBeGreaterThan(0);
  });

  test('반복 일정 수정 시 "아니오" 선택하면 모든 일정이 수정된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 먼저 반복 일정 생성
    await saveSchedule(page, {
      title: '매일 회의',
      date: startDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '매일 진행되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 첫 번째 반복 일정 편집 버튼 클릭
    const editButtons = page.getByLabel('Edit event');
    await editButtons.first().click();

    // 다이얼로그가 나타나는지 확인
    await expect(page.getByText('반복 일정 수정')).toBeVisible();
    await expect(page.getByText('해당 일정만 수정하시겠어요?')).toBeVisible();

    // "아니오" 버튼 선택 (전체 수정)
    await page.getByText('아니오').click();

    // 일정 편집 폼에서 필드 채우기
    await page.getByLabel('제목').clear();
    await page.getByLabel('제목').fill('전체 변경된 회의');

    // 수정 완료
    await page.getByTestId('event-submit-button').click();

    await page.waitForTimeout(1000);
    // 결과 확인: 모든 일정이 변경되었는지 확인
    const updatedEventList = page.getByTestId('event-list');
    const updatedMeetings = updatedEventList.locator('text=전체 변경된 회의');
    const updatedCount = await updatedMeetings.count();
    expect(updatedCount).toBeGreaterThanOrEqual(2);

    // 기존 일정이 더 이상 없는지 확인
    await expect(updatedEventList.getByText('매일 회의')).not.toBeVisible();

    // 달력에서도 확인
    const monthView = page.getByTestId('month-view');
    const calendarMeetings = monthView.locator('text=전체 변경된 회의');
    const calendarCount = await calendarMeetings.count();
    expect(calendarCount).toBeGreaterThanOrEqual(2);
  });

  test('반복 일정 삭제 시 "예" 선택하면 해당 일정만 삭제된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 먼저 반복 일정 생성
    await saveSchedule(page, {
      title: '매일 회의',
      date: startDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '매일 진행되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 반복 일정이 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    const initialMeetings = eventList.locator('text=매일 회의');
    const initialCount = await initialMeetings.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // 달력에 일정이 표시되는지 확인
    const monthView = page.getByTestId('month-view');
    const initialCalendarMeetings = monthView.locator('text=매일 회의');
    const initialCalendarCount = await initialCalendarMeetings.count();
    expect(initialCalendarCount).toBeGreaterThanOrEqual(2);

    // 첫 번째 반복 일정 삭제 버튼 클릭
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    // 반복 일정 삭제 다이얼로그가 나타나는지 확인
    await expect(page.getByText('반복 일정 삭제')).toBeVisible();
    await expect(page.getByText('해당 일정만 삭제하시겠어요?')).toBeVisible();

    // "예" 버튼 선택 (단일 삭제)
    await page.getByText('예').click();

    // 삭제 완료 메시지 확인
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible({ timeout: 10000 });

    // 결과 확인: 한 개는 삭제되고 나머지는 유지
    const updatedEventList = page.getByTestId('event-list');
    const remainingMeetings = updatedEventList.locator('text=매일 회의');
    const remainingCount = await remainingMeetings.count();
    expect(remainingCount).toBeGreaterThanOrEqual(1);
    expect(remainingCount).toBeLessThan(initialCount);

    // 달력에서도 확인
    const updatedMonthView = page.getByTestId('month-view');
    const remainingCalendarMeetings = updatedMonthView.locator('text=매일 회의');
    const calendarRemainingCount = await remainingCalendarMeetings.count();
    expect(calendarRemainingCount).toBeGreaterThanOrEqual(1);
    expect(calendarRemainingCount).toBeLessThan(initialCalendarCount);
  });

  test('반복 일정 삭제 시 "아니오" 선택하면 모든 일정이 삭제된다', async ({ page }) => {
    // 현재 날짜를 기준으로 테스트 데이터 생성
    const startDate = getCurrentDateString();
    const endDate = getDateString(2); // 현재 날짜에서 2일 후

    // 먼저 반복 일정 생성
    await saveSchedule(page, {
      title: '매일 회의',
      date: startDate,
      startTime: '14:00',
      endTime: '15:00',
      description: '매일 진행되는 회의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate },
    });

    // 일정 저장 후 성공 메시지 대기
    await page.waitForSelector('text=일정이 추가되었습니다', { timeout: 10000 });

    // 반복 일정이 생성되었는지 확인
    const eventList = page.getByTestId('event-list');
    const initialMeetings = eventList.locator('text=매일 회의');
    const initialCount = await initialMeetings.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // 달력에 일정이 표시되는지 확인
    const monthView = page.getByTestId('month-view');
    const initialCalendarMeetings = monthView.locator('text=매일 회의');
    const initialCalendarCount = await initialCalendarMeetings.count();
    expect(initialCalendarCount).toBeGreaterThanOrEqual(2);

    // 첫 번째 반복 일정 삭제 버튼 클릭
    const deleteButtons = page.getByLabel('Delete event');
    await deleteButtons.first().click();

    // 다이얼로그가 나타나는지 확인
    await expect(page.getByText('반복 일정 삭제')).toBeVisible();
    await expect(page.getByText('해당 일정만 삭제하시겠어요?')).toBeVisible();

    // "아니오" 버튼 선택 (전체 삭제)
    await page.getByText('아니오').click();

    // 삭제 완료 메시지 확인
    await expect(page.getByText('일정이 삭제되었습니다')).toBeVisible({ timeout: 10000 });

    // 결과 확인: 모든 일정이 삭제되었는지 확인
    const updatedEventList = page.getByTestId('event-list');
    const remainingMeetings = updatedEventList.locator('text=매일 회의');
    const remainingCount = await remainingMeetings.count();
    expect(remainingCount).toBe(0);

    // 달력에서도 확인
    const updatedMonthView = page.getByTestId('month-view');
    const remainingCalendarMeetings = updatedMonthView.locator('text=매일 회의');
    const calendarRemainingCount = await remainingCalendarMeetings.count();
    expect(calendarRemainingCount).toBe(0);
  });
});
