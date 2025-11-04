import { randomUUID } from 'crypto';
import fs from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import express from 'express';

const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.json());

/**
 * E2E 테스트 환경 여부에 따라 적절한 JSON DB 파일 이름을 결정합니다.
 * @type {string} 'e2e.json' 또는 'realEvents.json'
 */
const dbName = process.env.TEST_ENV === 'e2e' ? 'e2e.json' : 'realEvents.json';

/**
 * JSON 파일에서 현재 이벤트 데이터를 비동기적으로 읽어와 파싱합니다.
 * @async
 * @returns {Promise<object>} 파싱된 JSON 데이터 (예: { events: [...] })
 */
const getEvents = async () => {
  const data = await readFile(`${__dirname}/src/__mocks__/response/${dbName}`, 'utf8');
  return JSON.parse(data);
};

/**
 * @route GET /api/events
 * @description 저장된 모든 이벤트를 조회합니다.
 * @returns {object} JSON 응답 (예: { events: [...] })
 */
app.get('/api/events', async (_, res) => {
  const events = await getEvents();
  res.json(events);
});

/**
 * @route POST /api/events
 * @description 단일 이벤트를 새로 생성합니다.
 * @param {EventForm} req.body - 생성할 이벤트 데이터 (EventForm 타입).
 * @returns {object} 201 Created - 생성된 이벤트 객체 (id 포함).
 */
app.post('/api/events', async (req, res) => {
  const events = await getEvents();
  // [✅ 스펙 4.1] `seriesId`가 `null`로 오는 경우(단일 수정)를 대비해 `id`만 생성합니다.
  const newEvent = { id: randomUUID(), ...req.body };

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, newEvent],
    })
  );

  res.status(201).json(newEvent);
});

/**
 * @route PUT /api/events/:id
 * @description ID를 기준으로 단일 이벤트 또는 마스터 이벤트를 수정합니다.
 * [중요] 이 엔드포인트는 '전체 수정' 또는 '예외 날짜 추가'를 구분하지 않고,
 * 전달받은 body로 이벤트를 덮어씁니다.
 * @param {string} req.params.id - 수정할 이벤트의 ID.
 * @param {Partial<Event> | object} req.body - 수정할 필드.
 * - [✅ 스펙 4.2] (전체 수정 시) `{ "title": "...", "repeat": { ... } }`
 * - [✅ 스펙 5.1] (단일 삭제 시) `{ "addExceptionDate": "YYYY-MM-DD" }`
 * @returns {object} 200 OK - 수정된 이벤트 객체.
 * @returns {object} 404 Not Found - 해당 ID의 이벤트가 없을 경우.
 */
app.put('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const id = req.params.id; // URL 파라미터 id는 seriesId일 수도, event id일 수도 있음
  const eventIndex = events.events.findIndex((event) => event.id === id);

  if (eventIndex > -1) {
    const newEvents = [...events.events];

    // [✅ 스펙 5.1] 단일 삭제(예외 날짜 추가) 로직
    // 요청 본문에 addExceptionDate 필드만 있는지 확인
    if (req.body.addExceptionDate && Object.keys(req.body).length === 1) {
      const existingExceptions = newEvents[eventIndex].exceptionDates || [];
      newEvents[eventIndex] = {
        ...newEvents[eventIndex],
        exceptionDates: [...existingExceptions, req.body.addExceptionDate],
      };
    } else {
      // [✅ 스펙 4.2] 전체 수정 로직 (단순 덮어쓰기)
      newEvents[eventIndex] = { ...events.events[eventIndex], ...req.body };
    }

    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(newEvents[eventIndex]); // 수정된 이벤트 반환
  } else {
    res.status(404).send('Event not found');
  }
});

/**
 * @route DELETE /api/events/:id
 * @description ID를 기준으로 단일 이벤트 또는 **반복 시리즈 전체**를 삭제합니다.
 * @param {string} req.params.id - 삭제할 이벤트의 ID 또는 `seriesId`.
 * @returns {object} 204 No Content - 성공적으로 삭제됨.
 * @returns {object} 404 Not Found - (이 코드는 404를 반환하지 않으나, 스펙상 필요할 수 있음)
 */
app.delete('/api/events/:id', async (req, res) => {
  const events = await getEvents();
  const id = req.params.id; // 이 ID는 seriesId일 수 있음 (스펙 5.2)

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      // [✅ 스펙 5.2] ID가 일치하거나 seriesId가 일치하는 모든 이벤트를 필터링
      events: events.events.filter((event) => event.id !== id && event.seriesId !== id),
    })
  );

  res.status(204).send();
});

// --- (참고: 아래 /api/events-list 엔드포인트들은 스펙과 직접 관련 없어 보임) ---

/**
 * @route POST /api/events-list
 * @description (기능 불명확) 여러 이벤트를 목록으로 생성합니다.
 * @param {Event[]} req.body.events - 생성할 이벤트 목록.
 * @returns {object} 201 Created - 생성된 이벤트 목록.
 */
app.post('/api/events-list', async (req, res) => {
  const events = await getEvents();
  const repeatId = randomUUID(); // (이 로직은 스펙과 다름)
  const newEvents = req.body.events.map((event) => {
    const isRepeatEvent = event.repeat.type !== 'none';
    return {
      id: randomUUID(),
      ...event,
      repeat: {
        ...event.repeat,
        id: isRepeatEvent ? repeatId : undefined,
      },
    };
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: [...events.events, ...newEvents],
    })
  );

  res.status(201).json(newEvents);
});

/**
 * @route PUT /api/events-list
 * @description (기능 불명확) 여러 이벤트를 목록으로 수정합니다.
 * @param {Event[]} req.body.events - 수정할 이벤트 목록 (ID 포함).
 * @returns {object} 200 OK - 수정된 이벤트 목록.
 * @returns {object} 404 Not Found - 수정할 이벤트를 찾지 못한 경우.
 */
app.put('/api/events-list', async (req, res) => {
  const events = await getEvents();
  let isUpdated = false;

  const newEvents = [...events.events];
  req.body.events.forEach((event) => {
    const eventIndex = events.events.findIndex((target) => target.id === event.id);
    if (eventIndex > -1) {
      isUpdated = true;
      newEvents[eventIndex] = { ...events.events[eventIndex], ...event };
    }
  });

  if (isUpdated) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: newEvents,
      })
    );

    res.json(events.events);
  } else {
    res.status(404).send('Event not found');
  }
});

/**
 * @route DELETE /api/events-list
 * @description (기능 불명확) ID 목록을 받아 여러 이벤트를 삭제합니다.
 * @param {string[]} req.body.eventIds - 삭제할 이벤트 ID 목록.
 * @returns {object} 204 No Content - 성공적으로 삭제됨.
 */
app.delete('/api/events-list', async (req, res) => {
  const events = await getEvents();
  const newEvents = events.events.filter((event) => !req.body.eventIds.includes(event.id));

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({
      events: newEvents,
    })
  );

  res.status(204).send();
});

// --- (참고: 아래 /api/recurring-events 엔드포인트들은 스펙과 유사함) ---

/**
 * @route PUT /api/recurring-events/:repeatId
 * @description (스펙 4.2와 유사) '전체 시리즈 수정'을 수행합니다.
 * @param {string} req.params.repeatId - 수정할 `repeat.id` (seriesId).
 * @param {Partial<EventForm>} req.body - 수정할 필드.
 * @returns {object} 200 OK - 수정된 시리즈 이벤트 목록.
 * @returns {object} 404 Not Found - 해당 시리즈가 없을 경우.
 */
app.put('/api/recurring-events/:repeatId', async (req, res) => {
  const events = await getEvents();
  const repeatId = req.params.repeatId;
  const updateData = req.body;

  // (이 로직은 `event.repeat.id`를 사용하나, 스펙은 `event.seriesId`를 사용함)
  const seriesEvents = events.events.filter((event) => event.repeat.id === repeatId);

  if (seriesEvents.length === 0) {
    return res.status(404).send('Recurring series not found');
  }

  const newEvents = events.events.map((event) => {
    if (event.repeat.id === repeatId) {
      return {
        ...event,
        title: updateData.title || event.title,
        description: updateData.description || event.description,
        location: updateData.location || event.location,
        category: updateData.category || event.category,
        notificationTime: updateData.notificationTime || event.notificationTime,
        repeat: updateData.repeat ? { ...event.repeat, ...updateData.repeat } : event.repeat,
      };
    }
    return event;
  });

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: newEvents })
  );

  res.json(seriesEvents);
});

/**
 * @route DELETE /api/recurring-events/:repeatId
 * @description (스펙 5.2와 유사) '전체 시리즈 삭제'를 수행합니다.
 * @param {string} req.params.repeatId - 삭제할 `repeat.id` (seriesId).
 * @returns {object} 204 No Content - 성공적으로 삭제됨.
 * @returns {object} 404 Not Found - 해당 시리즈가 없을 경우.
 */
app.delete('/api/recurring-events/:repeatId', async (req, res) => {
  const events = await getEvents();
  const repeatId = req.params.repeatId;

  const remainingEvents = events.events.filter((event) => event.repeat.id !== repeatId);

  if (remainingEvents.length === events.events.length) {
    return res.status(404).send('Recurring series not found');
  }

  fs.writeFileSync(
    `${__dirname}/src/__mocks__/response/${dbName}`,
    JSON.stringify({ events: remainingEvents })
  );

  res.status(204).send();
});

/**
 * 서버를 시작하고, DB 파일이 없으면 빈 파일로 초기화합니다.
 */
app.listen(port, () => {
  if (!fs.existsSync(`${__dirname}/src/__mocks__/response/${dbName}`)) {
    fs.writeFileSync(
      `${__dirname}/src/__mocks__/response/${dbName}`,
      JSON.stringify({
        events: [],
      })
    );
  }
  console.log(`Server running at http://localhost:${port}`);
});
