import type { PurchaseProps, PurchaseItemEntry, PurchaseItemLocationEntry } from 'src/api/purchases';

import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import { DialogTitle } from '@mui/material';
import ListItem from '@mui/material/ListItem';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import WarningIcon from '@mui/icons-material/Warning';
import DialogContent from '@mui/material/DialogContent';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { updatePurchase } from 'src/api/purchases';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import PurchaseEditDialog from 'src/sections/purchase/purchase-edit-dialog'; 

// ----------------------------------------------------------------------
type PurchaseTableRowProps = {
  row: PurchaseProps;
  selected: boolean;
  onSelectRow: () => void;
  serial: number;
  onEdit?: (updatedPurchase: PurchaseProps) => void;
  onDelete?: (id: number) => void;
};

export function PurchaseTableRow({
  row,
  selected,
  onSelectRow,
  serial,
  onEdit,
  onDelete,
}: PurchaseTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updatedPurchase, setUpdatedPurchase] = useState(row);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseProps | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  const handleImageClick = () => setOpenImageModal(true);
  const handleCloseImageModal = () => setOpenImageModal(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (updatedPurchase.invoice_image instanceof File) {
      const objectUrl = URL.createObjectURL(updatedPurchase.invoice_image);
      setPreviewUrl(objectUrl);

      cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      };
    } else if (typeof updatedPurchase.invoice_image === 'string') {
      setPreviewUrl(updatedPurchase.invoice_image);
    }

    return cleanup;
  }, [updatedPurchase.invoice_image]);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('supplier_name', updatedPurchase.supplier_name);
      if (updatedPurchase.invoice_number)
        formData.append('invoice_number', updatedPurchase.invoice_number);
      formData.append('purchase_date', updatedPurchase.purchase_date);
      formData.append('discount', String(updatedPurchase.discount));

      if (updatedPurchase.invoice_image instanceof File) {
        formData.append('invoice_image', updatedPurchase.invoice_image);
      }

      console.log('Submitting purchase update:', updatedPurchase.id);
      await updatePurchase(updatedPurchase.id!, formData);

      enqueueSnackbar('Purchase updated successfully!', { variant: 'success' });
      onEdit?.(updatedPurchase);
    } catch (error: any) {
      enqueueSnackbar('Failed to update purchase.', { variant: 'error' });
      console.error('Update failed:', error);
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell>{serial}</TableCell>

        <TableCell>
          <Avatar
            src={
              imageError
                ? '/assets/images/fallback-image.png'
                : previewUrl || undefined
            }
            alt="Invoice"
            variant="rounded"
            sx={{ width: 48, height: 48, cursor: 'pointer' }}
            onClick={handleImageClick}
            onError={() => setImageError(true)}
          />
        </TableCell>

        <TableCell>{row.supplier_name}</TableCell>
        <TableCell>{row.invoice_number || '—'}</TableCell>
        <TableCell>{row.purchase_date}</TableCell>
        <TableCell>{row.discount.toFixed(2)}</TableCell>
        <TableCell>{row.total_amount?.toFixed(2) ?? '—'}</TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Options Popover */}
      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              handleClosePopover();
              setPurchaseToEdit(row);
              setEditDialogOpen(true);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClosePopover();
              onDelete?.(row.id!);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>

      {/* Image Modal */}
      <Dialog open={openImageModal} onClose={handleCloseImageModal} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={
              imageError
                ? '/assets/images/fallback-image.png'
                : previewUrl || ''
            }
            alt="Invoice"
            sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <PurchaseEditDialog
        open={editDialogOpen}
        purchase={purchaseToEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setPurchaseToEdit(null);
        }}
        onSuccess={(updated: PurchaseProps) => {
          setEditDialogOpen(false);
          setPurchaseToEdit(null);
          onEdit?.(updated);
        }}
      />
    </>
  );
}
