import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import EventFormPanel from './EventFormPanel';
import { Event, RepeatType } from '../types';

const defaultFormProps = {
  title: '',
  date: '2025-10-26',
  startTime: '09:00',
  endTime: '10:00',
  description: '',
  location: '',
  category: '업무',
  isRepeating: false,
  repeatType: 'none' as RepeatType,
  repeatInterval: 1,
  repeatEndDate: '',
  notificationTime: 10,
  startTimeError: null,
  endTimeError: null,
  editingEvent: null,
};

const mockEvent: Event = {
  id: '1',
  title: '기존 이벤트',
  date: '2025-10-26',
  startTime: '10:00',
  endTime: '11:00',
  description: '수정할 이벤트 설명',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const categories = ['업무', '개인', '가족', '기타'];
const notificationOptions = [
  { value: 0, label: '없음' },
  { value: 5, label: '5분 전' },
  { value: 10, label: '10분 전' },
];

const meta = {
  title: 'Components/EventFormPanel',
  component: EventFormPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    categories,
    notificationOptions,
    onTitleChange: fn(),
    onDateChange: fn(),
    onStartTimeChange: fn(),
    onEndTimeChange: fn(),
    onDescriptionChange: fn(),
    onLocationChange: fn(),
    onCategoryChange: fn(),
    onIsRepeatingChange: fn(),
    onRepeatTypeChange: fn(),
    onRepeatIntervalChange: fn(),
    onRepeatEndDateChange: fn(),
    onNotificationTimeChange: fn(),
    onTimeBlur: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof EventFormPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    formProps: { ...defaultFormProps },
  },
};

export const EditMode: Story = {
  args: {
    formProps: { ...defaultFormProps, ...mockEvent, editingEvent: mockEvent },
  },
};

export const CreateModeRepeating: Story = {
  args: {
    formProps: {
      ...defaultFormProps,
      isRepeating: true,
      repeatType: 'daily',
      repeatInterval: 1,
      repeatEndDate: '2025-11-30',
    },
  },
};

export const CreateModeWithErrors: Story = {
  args: {
    formProps: {
      ...defaultFormProps,
      startTime: '10:00',
      endTime: '09:00',
      startTimeError: '시작 시간은 종료 시간보다 빨라야 합니다.',
      endTimeError: '종료 시간은 시작 시간보다 빨라야 합니다.',
    },
  },
};
