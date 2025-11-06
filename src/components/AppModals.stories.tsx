import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import AppModals from './AppModals';
import { Event } from '../types';

// AppModals.tsx에 정의된 Notification 인터페이스를 모방합니다.
interface Notification {
  id: string;
  message: string;
}

const mockEvent: Event = {
  id: '1',
  title: '겹치는 이벤트',
  date: '2025-10-28',
  startTime: '10:00',
  endTime: '11:00',
  description: '겹침 테스트용 이벤트',
  location: '온라인',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const mockRecurringEvent: Event = {
  id: '2',
  title: '반복 이벤트',
  date: '2025-10-29',
  startTime: '14:00',
  endTime: '15:00',
  description: '반복 테스트용 이벤트',
  location: '회의실',
  category: '개인',
  repeat: { type: 'daily', interval: 1, endDate: '2025-11-05' },
  notificationTime: 10,
};

const meta = {
  title: 'Components/AppModals',
  component: AppModals,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    // Default props for all stories (all modals closed, no notifications)
    isOverlapDialogOpen: false,
    onOverlapDialogClose: fn(),
    onOverlapDialogConfirm: fn(),
    overlappingEvents: [],
    isRecurringDialogOpen: false,
    onRecurringDialogClose: fn(),
    onRecurringDialogConfirm: fn(),
    recurringDialogEvent: null,
    recurringDialogMode: 'edit',
    notifications: [],
    setNotifications: fn(),
  },
} satisfies Meta<typeof AppModals>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // All modals closed, no notifications
  args: {},
};

export const OverlapDialog: Story = {
  args: {
    isOverlapDialogOpen: true,
    overlappingEvents: [mockEvent],
  },
};

export const RecurringDialogEditMode: Story = {
  args: {
    isRecurringDialogOpen: true,
    recurringDialogEvent: mockRecurringEvent,
    recurringDialogMode: 'edit',
  },
};

export const RecurringDialogDeleteMode: Story = {
  args: {
    isRecurringDialogOpen: true,
    recurringDialogEvent: mockRecurringEvent,
    recurringDialogMode: 'delete',
  },
};

export const RecurringDialogMoveMode: Story = {
  args: {
    isRecurringDialogOpen: true,
    recurringDialogEvent: mockRecurringEvent,
    recurringDialogMode: 'move',
  },
};

export const WithNotifications: Story = {
  args: {
    notifications: [
      { id: '1', message: '첫 번째 알림입니다.' },
      { id: '2', message: '두 번째 알림입니다.' },
    ],
  },
};
