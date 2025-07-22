// src/sections/user/CreateUserDialog.tsx
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { Iconify } from 'src/components/iconify';
import CreateUserForm from 'src/sections/user/create-user-form';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateUserDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Create New User
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
        Close
          {/* <Iconify icon="solar:close-circle-bold" /> */}
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <CreateUserForm />
      </DialogContent>
    </Dialog>
  );
}
