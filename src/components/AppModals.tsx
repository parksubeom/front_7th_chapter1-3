// AppModals.tsx

import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';

import RecurringEventDialog from './RecurringEventDialog.tsx';
import { Event } from '../types.ts';

// App.tsx의 useNotifications 훅에서 사용하는 타입과 일치시킵니다.
// 간단하게 message 프로퍼티만 정의합니다.
interface Notification {
  id: string;
  message: string;
}

interface AppModalsProps {
  // 일정 겹침 다이얼로그 Props
  isOverlapDialogOpen: boolean;
  onOverlapDialogClose: () => void;
  onOverlapDialogConfirm: () => void;
  overlappingEvents: Event[];

  // 반복 일정 다이얼로그 Props
  isRecurringDialogOpen: boolean;
  onRecurringDialogClose: () => void;
  onRecurringDialogConfirm: (editSingleOnly: boolean) => void;
  recurringDialogEvent: Event | null;
  recurringDialogMode: 'edit' | 'delete' | 'move';

  // 알림 (Notifications) Props
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

function AppModals({
  isOverlapDialogOpen,
  onOverlapDialogClose,
  onOverlapDialogConfirm,
  overlappingEvents,
  isRecurringDialogOpen,
  onRecurringDialogClose,
  onRecurringDialogConfirm,
  recurringDialogEvent,
  recurringDialogMode,
  notifications,
  setNotifications,
}: AppModalsProps) {
  return (
    <>
      {/* 1. 일정 겹침 다이얼로그 */}
      <Dialog open={isOverlapDialogOpen} onClose={onOverlapDialogClose}>
        <DialogTitle>일정 겹침 경고</DialogTitle>
        <DialogContent>
          <DialogContentText>다음 일정과 겹칩니다:</DialogContentText>
          {overlappingEvents.map((event) => (
            <Typography key={event.id} sx={{ ml: 1, mb: 1 }}>
              {event.title} ({event.date} {event.startTime}-{event.endTime})
            </Typography>
          ))}
          <DialogContentText>계속 진행하시겠습니까?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onOverlapDialogClose}>취소</Button>
          <Button
            color="error"
            onClick={onOverlapDialogConfirm} // App.tsx에서 전달된 핸들러 사용
          >
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. 반복 일정 다이얼로그 */}
      <RecurringEventDialog
        open={isRecurringDialogOpen}
        onClose={onRecurringDialogClose}
        onConfirm={onRecurringDialogConfirm}
        event={recurringDialogEvent}
        mode={recurringDialogMode}
      />

      {/* 3. 알림 스택 */}
      {notifications.length > 0 && (
        <Stack position="fixed" top={16} right={16} spacing={2} alignItems="flex-end">
          {notifications.map((notification, index) => (
            <Alert
              key={index}
              severity="info"
              sx={{ width: 'auto' }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Close />
                </IconButton>
              }
            >
              <AlertTitle>{notification.message}</AlertTitle>
            </Alert>
          ))}
        </Stack>
      )}
    </>
  );
}

export default AppModals;
