import { test, expect } from '@playwright/test';

test('C: Click-to-Create (단일 일정 생성)', async ({ page }) => {
  // 1. 페이지 이동
  await page.goto('http://localhost:5174/');

  // 폼이 처음에는 비어있는지 확인
  const dateInput = page.getByRole('textbox', { name: '날짜' });
  // 2. 10월 15일 날짜 셀을 클릭 (2025년 10월 기준)
  await page.getByRole('cell', { name: '15' }).first().click();

  // 3.  날짜가 올바르게 채워졌는지 검증
  await expect(dateInput).toHaveValue('2025-11-15');

  // 4.  누락된 '제목' 필드 채우기
  await page.getByRole('textbox', { name: '제목' }).fill('E2E 테스트 일정');

  // 5. 나머지 폼 채우기
  await page.getByRole('textbox', { name: '시작 시간' }).fill('14:30');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('15:30');
  await page.getByRole('textbox', { name: '설명' }).fill('테스트입니다.');
  await page.getByRole('textbox', { name: '위치' }).fill('서울');

  // 6.   카테고리 Select/Option 상호작용
  // 6.1. 콤보박스(Select)를 클릭하여 옵션 목록을 연다
  await page.getByRole('combobox', { name: '업무' }).click();
  // 6.2. '기타' 옵션을 클릭한다
  await page.getByRole('option', { name: '기타' }).click();

  // 7. 저장 버튼 클릭
  await page.getByTestId('event-submit-button').click();

  // 8. (모달이 닫히는 대신) 폼이 리셋되었는지(비워졌는지) 검증
  await expect(page.getByRole('textbox', { name: '제목' })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: '날짜' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: '시작 시간' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: '종료 시간' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: '설명' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: '위치' })).toBeEmpty();
  await expect(page.getByRole('combobox', { name: '업무' })).toHaveValue('');

  // 9. 캘린더 뷰 또는 이벤트 목록에 새 일정이 렌더링되었는지 확인
  const calendarView = page.locator('[data-testid="month-view-container"]'); // (또는 event-list-panel)
  await expect(calendarView.locator('text=E2E 테스트 일정')).toBeVisible();
});

test('U: 단일 일정 수정', async ({ page }) => {
  await page.goto('http://localhost:5174/');

  // (e2e.json DB에 id: 'test-event-1'인 이벤트가 있다고 가정)
  const eventItemId = '[data-testid="day-cell-07d8329a-b47a-487f-90d8-fe387735fb0d"]';

  // 1. 텍스트가 아닌 data-testid로 수정할 이벤트를 명확히 찾음
  const eventItem = page.locator(eventItemId);
  await expect(eventItem).toBeVisible();
  await expect(eventItem).toContainText('E2E테스트');

  // 2. nth(3) 대신, 찾은 이벤트(eventItem) 내부의 수정 버튼 클릭
  await page
    .getByTestId('day-cell-07d8329a-b47a-487f-90d8-fe387735fb0d')
    .getByRole('button', { name: 'Edit event' })
    .click();

  // 3. 폼이 열리고 데이터가 채워졌는지 검증
  await expect(page.getByRole('textbox', { name: '제목' })).toHaveValue('123123');
  await expect(page.getByRole('textbox', { name: '날짜' })).toHaveValue('2025-11-08');
  await expect(page.getByRole('textbox', { name: '시작 시간' })).toHaveValue('14:03');
  await expect(page.getByRole('textbox', { name: '종료 시간' })).toHaveValue('16:44');
  await expect(page.getByRole('textbox', { name: '설명' })).toHaveValue('123');
  await expect(page.getByRole('textbox', { name: '위치' })).toHaveValue('123');

  // 4. Select 값 검증
  await expect(page.getByLabel('업무', { exact: true })).toContainText('업무');

  // 5. 폼 수정 및 저장
  await page.getByRole('textbox', { name: '제목' }).fill('e2e폼수정');
  await page.getByTestId('event-submit-button').click(); // 이 클릭도 비동기이므로 await

  // 6. 최종 검증 (더 안정적인 방식)
  // 6.1. 기존 제목(E2E테스트)이 사라졌는지 확인
  await expect(page.locator(eventItemId).locator('text=123123')).not.toBeVisible();

  // 6.2. 새 제목(E2E테스트 수정)이 나타났는지 확인
  await expect(eventItem.locator('text=e2e폼수정')).toBeVisible();

  // 6.3. (선택적) 캘린더 뷰에서도 확인
  await expect(page.getByRole('cell', { name: 'e2e폼수정' })).toBeVisible();
});

test('D: 단일 일정 삭제', async ({ page }) => {
  await expect(
    page.locator('div').filter({ hasText: 'E2E테스트 수정2025-11-1514:30 - 15' }).nth(4)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete event' }).nth(3).click();
  await expect(
    page.locator('div').filter({ hasText: 'E2E테스트 수정2025-11-1514:30 - 15' }).nth(4)
  ).not.toBeVisible();
});
