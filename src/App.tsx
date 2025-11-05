// App.tsx (최종 리팩토링 완료)

import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Box, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import AppModals from './components/AppModals.tsx';
import CalendarView from './components/CalendarView.tsx';
import EventFormPanel from './components/EventFormPanel.tsx';
import EventListPanel from './components/EventListPanel.tsx';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventForm } from './hooks/useEventForm.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useRecurringEventOperations } from './hooks/useRecurringEventOperations.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event, EventForm, RepeatType } from './types.ts';
import { addDays, calculateDaysDiff } from './utils/dateUtils.ts';
import { findOverlappingEvents } from './utils/eventOverlap.ts';
import { getTimeErrorMessage } from './utils/timeValidation.ts';

// 전역 상수 정의
const categories = ['업무', '개인', '가족', '기타'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

const getRepeatTypeLabel = (type: RepeatType): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

function App() {
  // 1. 이벤트 폼 훅
  const {
    title,
    setTitle,
    date,
    setDate,
    startTime,
    endTime,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    isRepeating,
    setIsRepeating,
    repeatType,
    setRepeatType,
    repeatInterval,
    setRepeatInterval,
    repeatEndDate,
    setRepeatEndDate,
    notificationTime,
    setNotificationTime,
    startTimeError,
    endTimeError,
    editingEvent,
    setEditingEvent,
    handleStartTimeChange,
    handleEndTimeChange,
    resetForm,
    editEvent,
  } = useEventForm();

  // 2. 이벤트 CRUD 훅
  const { events, saveEvent, updateEvent, deleteEvent, createRepeatEvent, fetchEvents } =
    useEventOperations(Boolean(editingEvent), () => setEditingEvent(null));

  // 3. 반복 이벤트 훅
  const { handleRecurringEdit, handleRecurringDelete, findRelatedRecurringEvents } =
    useRecurringEventOperations(events, async () => {
      // After recurring edit, refresh events from server
      await fetchEvents();
      setEditingEvent(null);
    });

  // 4. 알림 훅
  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);

  // 5. 캘린더 뷰 훅
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();

  // 6. 검색 훅
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  // 7. DND 및 모달 상태
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);
  const [isRecurringDialogOpen, setIsRecurringDialogOpen] = useState(false);
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<Event | null>(null);
  const [pendingRecurringDelete, setPendingRecurringDelete] = useState<Event | null>(null);
  const [recurringEditMode, setRecurringEditMode] = useState<boolean | null>(null); // true = single, false = all
  const [recurringDialogMode, setRecurringDialogMode] = useState<'edit' | 'delete' | 'move'>(
    'edit'
  );
  const [pendingDragMove, setPendingDragMove] = useState<{
    event: Event;
    newDate: string;
  } | null>(null);
  const [pendingEvent, setPendingEvent] = useState<Event | EventForm | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  // 8. 핸들러 함수들

  // 반복 일정 다이얼로그 확인
  const handleRecurringConfirm = async (editSingleOnly: boolean) => {
    // 이동 모드 처리
    if (recurringDialogMode === 'move' && pendingDragMove) {
      await handleRecurringMove(pendingDragMove.event, pendingDragMove.newDate, editSingleOnly);
      setIsRecurringDialogOpen(false);
      setPendingDragMove(null);
      return;
    }

    // 편집 모드 처리
    if (recurringDialogMode === 'edit' && pendingRecurringEdit) {
      setRecurringEditMode(editSingleOnly);
      editEvent(pendingRecurringEdit);
      setIsRecurringDialogOpen(false);
      setPendingRecurringEdit(null);
      return;
    }

    // 삭제 모드 처리
    if (recurringDialogMode === 'delete' && pendingRecurringDelete) {
      try {
        await handleRecurringDelete(pendingRecurringDelete, editSingleOnly);
        enqueueSnackbar('일정이 삭제되었습니다', { variant: 'success' });
      } catch (error) {
        console.error(error);
        enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
      }
      setIsRecurringDialogOpen(false);
      setPendingRecurringDelete(null);
    }
  };

  // 반복 일정인지 확인
  const isRecurringEvent = (event: Event): boolean => {
    return event.repeat.type !== 'none' && event.repeat.interval > 0;
  };

  // 수정 버튼 클릭 (목록에서 사용)
  const handleEditEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      setPendingRecurringEdit(event);
      setRecurringDialogMode('edit');
      setIsRecurringDialogOpen(true);
    } else {
      editEvent(event);
    }
  };

  // 삭제 버튼 클릭 (목록에서 사용)
  const handleDeleteEvent = (event: Event) => {
    if (isRecurringEvent(event)) {
      setPendingRecurringDelete(event);
      setRecurringDialogMode('delete');
      setIsRecurringDialogOpen(true);
    } else {
      deleteEvent(event.id);
    }
  };

  // 드래그 앤 드롭 이동 (반복)
  const handleRecurringMove = async (
    draggedEvent: Event,
    newDate: string,
    moveSingleOnly: boolean
  ) => {
    try {
      if (moveSingleOnly) {
        // "예" - 단일 일정만 이동 (반복 속성 제거)
        const updatedEvent: Event = {
          ...draggedEvent,
          date: newDate,
          repeat: {
            type: 'none',
            interval: 0,
          },
        };
        await updateEvent(updatedEvent);
        enqueueSnackbar('일정이 이동되었습니다', { variant: 'success' });
      } else {
        // "아니오" - 시리즈 전체 이동
        const daysDiff = calculateDaysDiff(draggedEvent.date, newDate);
        const relatedEvents = findRelatedRecurringEvents(draggedEvent);

        if (relatedEvents.length === 0) {
          const updatedEvent: Event = { ...draggedEvent, date: newDate };
          await updateEvent(updatedEvent);
        } else {
          const updatedEvents = relatedEvents.map((event) => ({
            ...event,
            date: addDays(event.date, daysDiff),
          }));

          const response = await fetch('/api/events-list', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: updatedEvents }),
          });

          if (!response.ok) {
            throw new Error('Failed to move recurring events');
          }

          await fetchEvents();
        }
        enqueueSnackbar('반복 일정이 모두 이동되었습니다', { variant: 'success' });
      }
    } catch (error) {
      console.error('일정 이동 실패:', error);
      enqueueSnackbar('일정 이동에 실패했습니다', { variant: 'error' });
    }
  };

  // 겹침 다이얼로그 확인
  const handleOverlapConfirm = async () => {
    if (!pendingEvent) return;

    try {
      await saveEvent(pendingEvent);
      resetForm();
    } catch (error) {
      console.error('일정 저장 실패 (겹침 무시):', error);
      enqueueSnackbar('일정 저장에 실패했습니다', { variant: 'error' });
    } finally {
      setIsOverlapDialogOpen(false);
      setPendingEvent(null);
    }
  };

  // 폼 제출 (추가 또는 수정)
  const addOrUpdateEvent = async () => {
    if (!title || !date || !startTime || !endTime) {
      enqueueSnackbar('필수 정보를 모두 입력해주세요.', { variant: 'error' });
      return;
    }

    if (startTimeError || endTimeError) {
      enqueueSnackbar('시간 설정을 확인해주세요.', { variant: 'error' });
      return;
    }

    const eventData: Event | EventForm = {
      id: editingEvent ? editingEvent.id : undefined,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: editingEvent
        ? editingEvent.repeat
        : {
            type: isRepeating ? repeatType : 'none',
            interval: repeatInterval,
            endDate: repeatEndDate || undefined,
          },
      notificationTime,
    };

    const overlapping = findOverlappingEvents(eventData, events);
    const hasOverlapEvent = overlapping.length > 0;

    // 수정
    if (editingEvent) {
      if (hasOverlapEvent) {
        setOverlappingEvents(overlapping);
        setIsOverlapDialogOpen(true);
        setPendingEvent(eventData);
        return;
      }

      if (
        editingEvent.repeat.type !== 'none' &&
        editingEvent.repeat.interval > 0 &&
        recurringEditMode !== null
      ) {
        await handleRecurringEdit(eventData as Event, recurringEditMode);
        setRecurringEditMode(null);
      } else {
        await saveEvent(eventData);
      }

      resetForm();
      return;
    }

    // 생성
    if (isRepeating) {
      await createRepeatEvent(eventData);
      resetForm();
      return;
    }

    if (hasOverlapEvent) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
      setPendingEvent(eventData);
      return;
    }

    await saveEvent(eventData);
    resetForm();
  };

  // DND 핸들러
  const handleDragStart = (event: DragStartEvent) => {
    setActiveEvent(event.active.data.current?.event);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveEvent(null);

    if (!over) {
      return;
    }

    const draggedEvent = active.data.current?.event as Event;
    const newDateString = over.id as string;

    if (draggedEvent.date === newDateString) {
      return;
    }

    if (isRecurringEvent(draggedEvent)) {
      setPendingDragMove({
        event: draggedEvent,
        newDate: newDateString,
      });
      setRecurringDialogMode('move');
      setIsRecurringDialogOpen(true);
      return;
    }

    const updatedEvent: Event = {
      ...draggedEvent,
      date: newDateString,
    };

    try {
      await updateEvent(updatedEvent);
    } catch (error) {
      console.error('일정 이동 실패:', error);
      enqueueSnackbar('일정 이동에 실패했습니다', { variant: 'error' });
    }
  };

  // 9. 렌더링
  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        {/* 왼쪽: 일정 추가/수정 폼 */}
        <EventFormPanel
          formProps={{
            title,
            date,
            startTime,
            endTime,
            description,
            location,
            category,
            isRepeating,
            repeatType,
            repeatInterval,
            repeatEndDate,
            notificationTime,
            startTimeError,
            endTimeError,
            editingEvent,
          }}
          categories={categories}
          notificationOptions={notificationOptions}
          onTitleChange={setTitle}
          onDateChange={setDate}
          onStartTimeChange={handleStartTimeChange}
          onEndTimeChange={handleEndTimeChange}
          onDescriptionChange={setDescription}
          onLocationChange={setLocation}
          onCategoryChange={setCategory}
          onIsRepeatingChange={setIsRepeating}
          onRepeatTypeChange={setRepeatType}
          onRepeatIntervalChange={setRepeatInterval}
          onRepeatEndDateChange={setRepeatEndDate}
          onNotificationTimeChange={setNotificationTime}
          onTimeBlur={() => getTimeErrorMessage(startTime, endTime)}
          onSubmit={addOrUpdateEvent}
        />

        {/* 가운데: 캘린더 뷰 */}
        <CalendarView
          view={view}
          setView={setView}
          navigate={navigate}
          currentDate={currentDate}
          holidays={holidays}
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          activeEvent={activeEvent}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onCellClick={setDate}
          getRepeatTypeLabel={getRepeatTypeLabel}
        />

        {/* 오른쪽: 일정 목록 (검색) */}
        <EventListPanel
          searchTerm={searchTerm}
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          notificationOptions={notificationOptions}
          onSearchTermChange={setSearchTerm}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          getRepeatTypeLabel={getRepeatTypeLabel}
        />
      </Stack>

      {/* 모달 및 알림 */}
      <AppModals
        isOverlapDialogOpen={isOverlapDialogOpen}
        onOverlapDialogClose={() => {
          setIsOverlapDialogOpen(false);
          setPendingEvent(null);
        }}
        onOverlapDialogConfirm={handleOverlapConfirm}
        overlappingEvents={overlappingEvents}
        isRecurringDialogOpen={isRecurringDialogOpen}
        onRecurringDialogClose={() => {
          setIsRecurringDialogOpen(false);
          setPendingRecurringEdit(null);
          setPendingRecurringDelete(null);
          setPendingDragMove(null);
        }}
        onRecurringDialogConfirm={handleRecurringConfirm}
        recurringDialogEvent={
          recurringDialogMode === 'edit'
            ? pendingRecurringEdit
            : recurringDialogMode === 'delete'
            ? pendingRecurringDelete
            : pendingDragMove?.event || null
        }
        recurringDialogMode={recurringDialogMode}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </Box>
  );
}

export default App;
