// CalendarView.tsx

import { DndContext, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';

import {
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import DraggableEvent from './DraggableEvent.tsx';

import DroppableCell from './DroppableCell.tsx';

import { Event, RepeatType } from '../types.ts';

import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils.ts';

// Props 정의

interface CalendarViewProps {
  view: 'week' | 'month';

  setView: (view: 'week' | 'month') => void;

  navigate: (direction: 'prev' | 'next') => void;

  currentDate: Date;

  holidays: Record<string, string>;

  filteredEvents: Event[];

  notifiedEvents: string[];

  activeEvent: Event | null;

  onDragStart: (event: DragStartEvent) => void;

  onDragEnd: (event: DragEndEvent) => void;

  onCellClick: (dateString: string) => void;

  getRepeatTypeLabel: (type: RepeatType) => string;
}

// App.tsx에서 캘린더 뷰 전용 상수를 이동

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function CalendarView(props: CalendarViewProps) {
  const {
    view,

    setView,

    navigate,

    currentDate,

    holidays,

    filteredEvents,

    notifiedEvents,

    activeEvent,

    onDragStart,

    onDragEnd,

    onCellClick,

    getRepeatTypeLabel,
  } = props;

  // --- App.tsx에서 renderWeekView 함수를 이동 ---

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>

        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                {weekDates.map((date, dayIndex) => {
                  const dateString = formatDate(date, date.getDate());

                  const day = date.getDate();

                  const holiday = holidays[dateString];

                  return (
                    <DroppableCell
                      key={date.toISOString()}
                      dateString={dateString}
                      day={day}
                      holiday={holiday}
                      onClick={() => onCellClick(dateString)} // props로 받은 핸들러 사용
                    >
                      {filteredEvents

                        .filter(
                          (event) => new Date(event.date).toDateString() === date.toDateString()
                        )

                        .map((event) => {
                          const isNotified = notifiedEvents.includes(event.id);

                          const isRepeating = event.repeat.type !== 'none';

                          return (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              isNotified={isNotified}
                              isRepeating={isRepeating}
                              getRepeatTypeLabel={getRepeatTypeLabel} // props로 받은 함수 사용
                              data-testid={`event-item-${event.id}`}
                            />
                          );
                        })}
                    </DroppableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  // --- App.tsx에서 renderMonthView 함수를 이동 ---

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return (
      <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatMonth(currentDate)}</Typography>

        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dateString = day ? formatDate(currentDate, day) : '';

                    const holiday = holidays[dateString];

                    return (
                      <DroppableCell
                        key={dayIndex}
                        dateString={dateString}
                        day={day}
                        holiday={holiday}
                        onClick={() => day && onCellClick(dateString)} // props로 받은 핸들러 사용
                      >
                        {day &&
                          getEventsForDay(filteredEvents, day).map((event) => {
                            const isNotified = notifiedEvents.includes(event.id);

                            const isRepeating = event.repeat.type !== 'none';

                            return (
                              <DraggableEvent
                                key={event.id}
                                event={event}
                                isNotified={isNotified}
                                isRepeating={isRepeating}
                                getRepeatTypeLabel={getRepeatTypeLabel} // props로 받은 함수 사용
                                data-testid={`event-item-${event.id}`}
                              />
                            );
                          })}
                      </DroppableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  // --- App.tsx에서 캘린더 뷰 관련 JSX를 이동 ---

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Stack flex={1} spacing={5}>
        <Typography variant="h4">일정 보기</Typography>

        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
            <ChevronLeft />
          </IconButton>

          <Select
            size="small"
            aria-label="뷰 타입 선택"
            value={view}
            onChange={(e) => setView(e.target.value as 'week' | 'month')}
          >
            <MenuItem value="week" aria-label="week-option">
              Week
            </MenuItem>

            <MenuItem value="month" aria-label="month-option">
              Month
            </MenuItem>
          </Select>

          <IconButton aria-label="Next" onClick={() => navigate('next')}>
            <ChevronRight />
          </IconButton>
        </Stack>

        {view === 'week' && renderWeekView()}

        {view === 'month' && renderMonthView()}
      </Stack>

      <DragOverlay
        dropAnimation={{
          duration: 200,

          easing: 'ease-out',

          keyframes() {
            return [
              { opacity: 1, scaleX: 1, scaleY: 1 },

              { opacity: 0, scaleX: 1, scaleY: 1 },
            ];
          },
        }}
      >
        {activeEvent && (
          <DraggableEvent
            event={activeEvent}
            isNotified={notifiedEvents.includes(activeEvent.id)}
            isRepeating={activeEvent.repeat.type !== 'none'}
            getRepeatTypeLabel={getRepeatTypeLabel}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default CalendarView;
