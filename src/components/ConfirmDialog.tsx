import React from 'react';
import { Dialog, DialogActions, DialogContent, Button, Fade } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});


interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, content, onConfirm, onCancel }) => {
  return (
    <Dialog 
      open={open} 
      TransitionComponent={Transition} 
      onClose={onCancel} 
      PaperProps={{
        style: {
          width: '230px',
          padding: '0.5em',
          borderRadius: 8,
          boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {title && (
        <DialogContent sx={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>
          <p>{title}</p>
        </DialogContent>
      )}
      <DialogContent sx={{ textAlign: 'center', fontSize: '16px' }}>
        <p>{content}</p>
      </DialogContent>
      <DialogActions sx={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
        <Button
          onClick={onCancel}
          fullWidth
          sx={{
            color: '#333',
            backgroundColor: '#eee',
            '&:hover': { backgroundColor: '#ddd' },
          }}
        >
          취소
        </Button>
        <Button
          onClick={onConfirm}
          fullWidth
          sx={{
            color: '#f7f7f7',
            backgroundColor: '#580EF6',
            '&:hover': { backgroundColor: '#4d0dc6' },
          }}
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
