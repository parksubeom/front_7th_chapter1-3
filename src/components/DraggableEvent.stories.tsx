import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import DraggableEvent from './DraggableEvent';
import { Event, RepeatType } from '../types';

const mockEvent: Event = {
  id: '1',
  title: '기본 이벤트',
  date: '2025-10-28',
  startTime: '10:00',
  endTime: '11:00',
  description: '기본 스토리북 이벤트',
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
  description: '반복되는 스토리북 이벤트',
  location: '회의실',
  category: '개인',
  repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
  notificationTime: 10,
};

const meta = {
  title: 'Components/DraggableEvent',
  component: DraggableEvent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
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
  },
} satisfies Meta<typeof DraggableEvent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultEvent: Story = {
  args: {
    event: mockEvent,
    isNotified: false,
    isRepeating: false,
  },
};

export const NotifiedEvent: Story = {
  args: {
    event: mockEvent,
    isNotified: true,
    isRepeating: false,
  },
};

export const RepeatingEvent: Story = {
  args: {
    event: mockRepeatingEvent,
    isNotified: false,
    isRepeating: true,
  },
};

export const NotifiedAndRepeatingEvent: Story = {
  args: {
    event: mockRepeatingEvent,
    isNotified: true,
    isRepeating: true,
  },
};
