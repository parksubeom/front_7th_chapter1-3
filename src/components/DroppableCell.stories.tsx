import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Box } from '@mui/material';

import DroppableCell from './DroppableCell';
import DraggableEvent from './DraggableEvent'; // CellWithEvent 스토리용
import { Event, RepeatType } from '../types';

// DraggableEvent 스토리에서 사용된 모의 이벤트를 재사용
const mockEvent: Event = {
  id: '1',
  title: '셀 내의 이벤트',
  date: '2025-10-20',
  startTime: '10:00',
  endTime: '11:00',
  description: '드롭 가능한 셀 테스트용 이벤트',
  location: '어딘가',
  category: '개인',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

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
  title: 'Components/DroppableCell',
  component: DroppableCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof DroppableCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCell: Story = {
  args: {
    dateString: '',
    day: null,
    children: <Box sx={{ height: '100%', width: '100%' }} />,
  },
};

export const CellWithDay: Story = {
  args: {
    dateString: '2025-10-15',
    day: 15,
    children: <Box sx={{ height: '100%', width: '100%' }} />,
  },
};

export const CellWithHoliday: Story = {
  args: {
    dateString: '2025-01-01',
    day: 1,
    holiday: '신정',
    children: <Box sx={{ height: '100%', width: '100%' }} />,
  },
};

export const CellWithEvent: Story = {
  args: {
    dateString: '2025-10-20',
    day: 20,
    children: (
      <DraggableEvent
        event={mockEvent}
        isNotified={false}
        isRepeating={false}
        getRepeatTypeLabel={getRepeatTypeLabelMock}
      />
    ),
  },
};
