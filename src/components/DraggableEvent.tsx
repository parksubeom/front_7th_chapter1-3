import { useDraggable } from '@dnd-kit/core';
import { Notifications, Repeat } from '@mui/icons-material';
import { Box, Stack, Tooltip, Typography } from '@mui/material';

import { Event, RepeatType } from '../types';

interface DraggableEventProps {
  event: Event;
  isNotified: boolean;
  isRepeating: boolean;
  getRepeatTypeLabel: (_type: RepeatType) => string;
}

const DraggableEvent = ({
  event,
  isNotified,
  isRepeating,
  getRepeatTypeLabel,
}: DraggableEventProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const eventBoxStyles = {
    notified: {
      backgroundColor: '#ffebee',
      fontWeight: 'bold',
      color: '#d32f2f',
    },
    normal: {
      backgroundColor: '#f5f5f5',
      fontWeight: 'normal',
      color: 'inherit',
    },
    common: {
      p: 0.5,
      my: 0.5,
      borderRadius: 1,
      minHeight: '18px',
      width: '100%',
      overflow: 'hidden',
    },
  };

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        ...style, // 드래그 스타일
        ...eventBoxStyles.common, // 공통 스타일
        ...(isNotified ? eventBoxStyles.notified : eventBoxStyles.normal), // 조건부 스타일
      }}
      data-testid={`event-item-${event.id}`}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (
          <Tooltip
            title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
            }`}
          >
            <Repeat fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
};

export default DraggableEvent;
