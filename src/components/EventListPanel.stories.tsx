import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import EventListPanel from './EventListPanel';
import { Event, RepeatType } from '../types';

const mockEvent: Event = {
  id: '1',
  title: '일반 이벤트',
  date: '2025-10-28',
  startTime: '10:00',
  endTime: '11:00',
  description: '이벤트 목록 패널 테스트',
  location: '온라인',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const mockRepeatingEvent: Event = {
  id: '2',
  title: '반복 이벤트',
  date: '2025-10-29',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복되는 이벤트',
  location: '회의실',
  category: '개인',
  repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
  notificationTime: 5,
};

const mockNotifiedEvent: Event = {
  id: '3',
  title: '알림 이벤트',
  date: '2025-10-30',
  startTime: '16:00',
  endTime: '17:00',
  description: '알림이 설정된 이벤트',
  location: '카페',
  category: '가족',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const notificationOptions = [
  { value: 0, label: '없음' },
  { value: 5, label: '5분 전' },
  { value: 10, label: '10분 전' },
];

const getRepeatTypeLabelMock = (type: RepeatType) => {
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
};

const meta = {
  title: 'Components/EventListPanel',
  component: EventListPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    onSearchTermChange: fn(),
    onEditEvent: fn(),
    onDeleteEvent: fn(),
    getRepeatTypeLabel: getRepeatTypeLabelMock,
    notificationOptions,
    searchTerm: '',
    notifiedEvents: [],
  },
} satisfies Meta<typeof EventListPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyList: Story = {
  args: {
    filteredEvents: [],
  },
};

export const SingleEvent: Story = {
  args: {
    filteredEvents: [mockEvent],
  },
};

export const MultipleEvents: Story = {
  args: {
    filteredEvents: [mockEvent, mockRepeatingEvent, mockNotifiedEvent],
    notifiedEvents: [mockNotifiedEvent.id],
  },
};

export const WithSearchTerm: Story = {
  args: {
    searchTerm: '이벤트',
    filteredEvents: [mockEvent, mockRepeatingEvent, mockNotifiedEvent],
    notifiedEvents: [mockNotifiedEvent.id],
  },
};
