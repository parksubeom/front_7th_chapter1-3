import * as fs from 'fs';
import * as path from 'path';

import { Page } from '@playwright/test';

import type { Event, RepeatInfo } from '../../types';

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns 현재 날짜 문자열 (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 현재 날짜에서 일수를 더한 날짜를 YYYY-MM-DD 형식으로 반환
 * @param days - 더할 일수 (음수 가능)
 * @returns 계산된 날짜 문자열 (YYYY-MM-DD)
 */
export const getDateString = (days: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 일정 생성 헬퍼 함수
 * @param page - Playwright Page 객체
 * @param form - 일정 폼 데이터
 */
export const saveSchedule = async (
  page: Page,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'> & { repeat?: RepeatInfo }
) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;

  // // "일정 추가" 버튼 클릭
  // await page.getByRole('button', { name: '일정 추가' }).click();

  // 폼 입력
  await page.getByLabel('제목').fill(title);
  await page.getByLabel('날짜').fill(date);
  await page.getByLabel('시작 시간').fill(startTime);
  await page.getByLabel('종료 시간').fill(endTime);
  await page.getByLabel('설명').fill(description);
  await page.getByLabel('위치').fill(location);

  // 카테고리 선택
  await page.getByLabel('카테고리').click();
  await page.getByRole('option', { name: `${category}-option` }).click();

  // 반복 일정 설정
  if (repeat) {
    await page.getByLabel('반복 일정').check();
    await page.getByLabel('반복 유형').click();
    await page.getByRole('option', { name: `${repeat.type}-option` }).click();
    await page.getByLabel('반복 간격').fill(String(repeat.interval));
    if (repeat.endDate) {
      await page.getByLabel('반복 종료일').fill(repeat.endDate);
    }
  }

  // 제출 버튼 클릭
  await page.getByTestId('event-submit-button').click();

  // // 겹침 경고 다이얼로그가 나타나는지 확인
  // const overlapDialog = page.getByText('일정 겹침 경고');
  // const isOverlapDialogVisible = await overlapDialog
  //   .isVisible({ timeout: 2000 })
  //   .catch(() => false);

  // if (isOverlapDialogVisible) {
  //   // 겹침 경고가 있으면 "계속 진행" 버튼 클릭
  //   await page.getByRole('button', { name: '계속 진행' }).click();
  // }
};

/**
 * 페이지 로딩 대기
 * @param page - Playwright Page 객체
 */
export const waitForPageLoad = async (page: Page) => {
  await page.goto('/');
  await page.waitForSelector('text=일정 로딩 완료!', { timeout: 10000 });
};

/**
 * 모든 이벤트 삭제 (테스트 데이터 초기화)
 * @param page - Playwright Page 객체
 */
export const clearAllEvents = async (page: Page) => {
  try {
    // 서버가 준비될 때까지 대기 (최대 5초)
    let retries = 10;
    let response;

    while (retries > 0) {
      try {
        response = await page.request.get('http://localhost:3000/api/events', {
          timeout: 2000,
        });
        if (response.ok()) {
          break;
        }
      } catch {
        retries--;
        if (retries === 0) {
          // 서버가 준비되지 않았으면 무시 (첫 테스트일 수 있음)
          return;
        }
        await page.waitForTimeout(500);
      }
    }

    if (!response || !response.ok()) {
      return;
    }

    const data = await response.json();
    const events = data.events || [];

    // 모든 이벤트 삭제
    if (events.length > 0) {
      const deletePromises = events.map((event: { id: string }) =>
        page.request
          .delete(`http://localhost:3000/api/events/${event.id}`, { timeout: 2000 })
          .catch(() => {
            // 개별 삭제 실패 시 무시
          })
      );
      await Promise.all(deletePromises);
    }
    // 페이지 새로고침은 waitForPageLoad에서 처리하므로 여기서는 하지 않음
    await resetE2eJsonFile();
  } catch {
    // API 호출 실패 시 무시 (서버가 아직 시작되지 않았을 수 있음)
    // 첫 테스트 실행 시 서버가 아직 준비되지 않았을 수 있음
    await resetE2eJsonFile();
  }
};

/**
 * e2e.json 파일을 빈 배열로 초기화
 * @param page - Playwright Page 객체 (사용하지 않지만 일관성을 위해 유지)
 */
export const resetE2eJsonFile = async () => {
  try {
    const filePath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    const emptyData = { events: [] };
    fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2), 'utf8');
  } catch (error) {
    // 파일 쓰기 실패 시 무시 (파일이 없을 수 있음)
    console.warn('e2e.json 파일 초기화 실패:', error);
  }
};
