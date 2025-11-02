import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Event } from '../types.ts';
import RecurringEventDialog from './RecurringEventDialog.tsx';

interface AppModalsProps {
  isOverlapDialogOpen: boolean;
  setIsOverlapDialogOpen: (isOpen: boolean) => void;
  overlappingEvents: Event[];
  onConfirmOverlap: () => void;
  isRecurringDialogOpen: boolean;
  handleRecurringConfirm: (editSingleOnly: boolean) => void;
  onClose: () => void;
  pendingRecurringEvent: Event | null;
  recurringDialogMode: 'edit' | 'delete';
}

function AppModals({
  isOverlapDialogOpen,
  setIsOverlapDialogOpen,
  overlappingEvents,
  onConfirmOverlap,
  isRecurringDialogOpen,
  handleRecurringConfirm,
  onClose,
  pendingRecurringEvent,
  recurringDialogMode,
}: AppModalsProps) {
  return (
    <>
      <Dialog open={isOverlapDialogOpen} onClose={() => setIsOverlapDialogOpen(false)}>
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
          <Button onClick={() => setIsOverlapDialogOpen(false)}>취소</Button>
          <Button color="error" onClick={onConfirmOverlap}>
            계속 진행
          </Button>
        </DialogActions>
      </Dialog>

      <RecurringEventDialog
        open={isRecurringDialogOpen}
        onClose={onClose}
        onConfirm={handleRecurringConfirm}
        event={pendingRecurringEvent}
        mode={recurringDialogMode}
      />
    </>
  );
}

export default AppModals;
