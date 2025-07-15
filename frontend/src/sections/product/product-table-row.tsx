import type { Theme } from '@mui/material/styles';

import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';

import { updateProduct } from 'src/api/products';
import { useSnackbar } from 'notistack';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type ProductProps = {
  id: string;
  uniqueId: string;
  itemName: string;
  brand: string;
  serialNumber: string;
  variants: string;
  category: string;
  rate: number;
  quantity: number;
  location: string;
  active: boolean;
  image?: string;
};

type ProductTableRowProps = {
  row: ProductProps;
  selected: boolean;
  onSelectRow: () => void;
  serial: number;
  onEdit?: (updatedProduct: ProductProps) => void;
  onDelete?: (id: string) => void;
  categories: { id: number; name: string }[];
  locations: { id: number; name: string }[];
};

export function ProductTableRow({
  row,
  selected,
  onSelectRow,
  serial,
  onEdit,
  onDelete,
  categories,
  locations,
}: ProductTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRow, setEditedRow] = useState(row);
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  const handleImageClick = () => {
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
  };

  const handleFieldChange = (field: keyof ProductProps, value: any) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };

  const toSnakeCase = (product: ProductProps) => ({
    unique_id: product.uniqueId,
    item_name: product.itemName,
    brand: product.brand,
    serial_number: product.serialNumber,
    variants: product.variants,
    category: product.category,
    rate: product.rate,
    quantity: product.quantity,
    location: product.location,
    active: product.active,
    image: product.image,
  });

  const handleSave = async () => {
    try {
      // 🔄 Convert category and location name to ID
      const categoryId = categories.find((cat) => cat.name === editedRow.category)?.id;
      const locationId = locations.find((loc) => loc.name === editedRow.location)?.id;

      if (!categoryId || !locationId) {
        enqueueSnackbar('Invalid category or location', { variant: 'error' });
        return;
      }

      // 🐍 Convert to snake_case keys
      const payload = {
        unique_id: editedRow.uniqueId,
        item_name: editedRow.itemName,
        brand: editedRow.brand,
        serial_number: editedRow.serialNumber,
        variants: editedRow.variants,
        category: categoryId,
        rate: parseFloat(editedRow.rate as any), // ensure number
        quantity: editedRow.quantity,
        location: locationId,
        active: editedRow.active,
        image: editedRow.image, // optional
      };

      console.log('✅ Payload to update:', payload);

      await updateProduct(editedRow.id, payload);

      enqueueSnackbar('Product updated successfully!', { variant: 'success' });
      setIsEditing(false);
      onEdit?.({ ...editedRow, category: editedRow.category, location: editedRow.location });
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      enqueueSnackbar('Failed to update product.', { variant: 'error' });
    }
  };

  const handleCancel = () => {
    setEditedRow(row);
    setIsEditing(false);
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
            src={imageError ? '/assets/images/fallback-image.png' : row.image || ''}
            alt={row.itemName}
            variant="rounded"
            sx={{ width: 48, height: 48, cursor: 'pointer' }}
            onClick={handleImageClick}
            onError={() => setImageError(true)}
          />
        </TableCell>

        <TableCell>{row.uniqueId}</TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              value={editedRow.itemName}
              onChange={(e) => handleFieldChange('itemName', e.target.value)}
            />
          ) : (
            row.itemName
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              value={editedRow.brand}
              onChange={(e) => handleFieldChange('brand', e.target.value)}
            />
          ) : (
            row.brand
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              value={editedRow.serialNumber}
              onChange={(e) => handleFieldChange('serialNumber', e.target.value)}
            />
          ) : (
            row.serialNumber
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              value={editedRow.variants}
              onChange={(e) => handleFieldChange('variants', e.target.value)}
            />
          ) : (
            row.variants
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <Select
              fullWidth
              size="small"
              value={editedRow.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
            >
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          ) : (
            row.category
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              type="number"
              value={editedRow.rate}
              onChange={(e) => handleFieldChange('rate', Number(e.target.value))}
            />
          ) : (
            row.rate
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <TextField
              variant="standard"
              type="number"
              value={editedRow.quantity}
              onChange={(e) => handleFieldChange('quantity', Number(e.target.value))}
            />
          ) : (
            row.quantity
          )}
        </TableCell>

        <TableCell>
          {isEditing ? (
            <Select
              fullWidth
              size="small"
              value={editedRow.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
            >
              {locations?.map((loc) => (
                <MenuItem key={loc.id} value={loc.name}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          ) : (
            row.location
          )}
        </TableCell>

        <TableCell align="center">
          {row.active ? (
            <Iconify width={22} icon="solar:check-circle-bold" sx={{ color: 'success.main' }} />
          ) : (
            <Label color="error">Inactive</Label>
          )}
        </TableCell>

        <TableCell align="right">
          {isEditing ? (
            <>
              <Button onClick={handleSave} color="primary" size="small">
                Save
              </Button>
              <Button onClick={handleCancel} color="inherit" size="small">
                Cancel
              </Button>
            </>
          ) : (
            <IconButton onClick={handleOpenPopover}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleClosePopover();
              setIsEditing(true);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClosePopover();
              onDelete?.(row.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>

      <Dialog open={openImageModal} onClose={handleCloseImageModal} maxWidth="sm" fullWidth>
        <IconButton
          aria-label="close"
          onClick={handleCloseImageModal}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme: Theme) => theme.palette.grey[500],
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>

        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={imageError ? '/assets/images/fallback-image.png' : row.image || ''}
            alt={row.itemName}
            sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
