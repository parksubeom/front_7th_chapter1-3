import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import CalendarView from './CalendarView';
import { Event, RepeatType } from '../types';

const mockEvent: Event = {
  id: '1',
  title: '스토리북 테스트 이벤트',
  date: '2025-10-28',
  startTime: '10:00',
  endTime: '11:00',
  description: '스토리북에서 렌더링되는 테스트 이벤트입니다.',
  location: '온라인',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const mockEventRecurring: Event = {
  id: '2',
  title: '반복 이벤트',
  date: '2025-10-29',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복되는 스토리북 이벤트',
  location: '회의실',
  category: '개인',
  repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
  notificationTime: 10,
};

const meta = {
  title: 'Components/CalendarView',
  component: CalendarView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    setView: fn(),
    navigate: fn(),
    onDragStart: fn(),
    onDragEnd: fn(),
    onCellClick: fn(),
    getRepeatTypeLabel: (type: RepeatType) => {
      switch (type) {
        case 'daily':
          return '매일';
        case 'weekly':
          return '매주';
        case 'monthly':
          return '매월';
        case 'yearly':
          return '매년';
        default:
          return '없음';
      }
    },
    currentDate: new Date('2025-10-26T12:00:00'), // 특정 날짜로 고정
    holidays: {},
    notifiedEvents: [],
    activeEvent: null,
  },
} satisfies Meta<typeof CalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MonthViewEmpty: Story = {
  args: {
    view: 'month',
    filteredEvents: [],
  },
};

export const MonthViewWithEvents: Story = {
  args: {
    view: 'month',
    filteredEvents: [mockEvent, mockEventRecurring],
  },
};

export const WeekViewEmpty: Story = {
  args: {
    view: 'week',
    filteredEvents: [],
  },
};

export const WeekViewWithEvents: Story = {
  args: {
    view: 'week',
    filteredEvents: [mockEvent, mockEventRecurring],
  },
};
