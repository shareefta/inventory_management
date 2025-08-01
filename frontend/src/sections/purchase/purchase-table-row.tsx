import type { PurchaseProps } from 'src/api/purchases';

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseProps | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell>{serial}</TableCell>

        <TableCell>{row.supplier_name}</TableCell>
        <TableCell>{row.invoice_number || '—'}</TableCell>
        <TableCell>{row.purchase_date}</TableCell>
        <TableCell>{(Number(row.discount) || 0).toFixed(2)}</TableCell>
        <TableCell>
          {typeof row.total_amount === 'number'
            ? row.total_amount.toFixed(2)
            : Number(row.total_amount || 0).toFixed(2)}
        </TableCell>
        <TableCell>{row.payment_mode}</TableCell>

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
