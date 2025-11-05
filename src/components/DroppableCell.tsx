import { useDroppable } from '@dnd-kit/core';
import { TableCell, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface DroppableCellProps {
  dateString: string;
  day: number | null;
  holiday?: string;
  onClick: () => void;
  children: ReactNode;
}

const DroppableCell = ({ dateString, day, holiday, onClick, children }: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: dateString });

  return (
    <TableCell
      ref={setNodeRef}
      onClick={onClick}
      sx={{
        height: '120px',
        verticalAlign: 'top',
        width: '14.28%',
        padding: 1,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isOver ? '#e3f2fd' : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
      data-testid={`day-cell-${dateString}`}
    >
      {day && (
        <>
          <Typography variant="body2" fontWeight="bold">
            {day}
          </Typography>
          {holiday && (
            <Typography variant="body2" color="error">
              {holiday}
            </Typography>
          )}
          {children}
        </>
      )}
    </TableCell>
  );
};

export default DroppableCell;
