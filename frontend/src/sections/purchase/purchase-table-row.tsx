import type { Theme } from '@mui/material/styles';

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

import { updateProduct } from 'src/api/products';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import PurchaseEditDialog from 'src/sections/purchase/purchase-edit-dialog'; 

// ----------------------------------------------------------------------
export type CategoryEntry = {
  id: number;
  name: string;
};

export type LocationEntry = {
  id: number;
  name: string;
};

export type ProductLocationEntry = {
  location: LocationEntry;
  quantity: number;
};

export type PurchaseProps = {
  id: string;
  uniqueId: string;
  itemName: string;
  brand: string;
  serialNumber: string;
  variants: string;
  category: string;
  rate: number;
  sellingPrice: number;
  minimumProfit: number;
  active: boolean;
  image?: string | File;
  locations: ProductLocationEntry[];
  total_quantity: number;
  description?: string;
};

type PurchaseTableRowProps = {
  row: PurchaseProps;
  selected: boolean;
  onSelectRow: () => void;
  serial: number;
  onEdit?: (updatedPurchase: PurchaseProps) => void;
  onDelete?: (id: string) => void;
  categories: { id: number; name: string }[];
  locations: { id: number; name: string }[];
  onShowBarcode: (product: PurchaseProps) => void
};

export function PurchaseTableRow({
  row,
  selected,
  onSelectRow,
  serial,
  onEdit,
  onDelete,
  categories,
  locations,
  onShowBarcode,
}: PurchaseTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedPurchase, setUpdatedPurchase] = useState(row);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [locationPopoverAnchor, setLocationPopoverAnchor] = useState<null | HTMLElement>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseProps | null>(null);
  const [purchase, setPurchase] = useState<PurchaseProps[]>([]);

  const updatePurchaseInTable = (purchaseToUpdate: PurchaseProps) => {
    setPurchase((prevPurchase) =>
      prevPurchase.map((p) => (p.id === purchaseToUpdate.id ? purchaseToUpdate : p))
    );
  };

  const handleItemClick = (desc: string) => {
    setDescriptionText(desc);
    setDescriptionOpen(true);
  };
  
  useEffect(() => {
    if (updatedPurchase.image instanceof File) {
      const objectUrl = URL.createObjectURL(updatedPurchase.image);
      setPreviewUrl(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      };
    } else {
      setPreviewUrl(null);
      return undefined;
    }
  }, [updatedPurchase.image]);

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

  const handleFieldChange = (field: keyof PurchaseProps, value: any) => {
    setUpdatedPurchase((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const rate = Number(updatedPurchase.rate);
    const sellingPrice = Number(updatedPurchase.sellingPrice);
    const minimumProfit = Number(updatedPurchase.minimumProfit ?? 10);

    const minRequired = rate + minimumProfit;

    if (sellingPrice < minRequired) {
      enqueueSnackbar(
        `❌ Selling Price must be at least Rate + Minimum Profit (₹${minRequired.toFixed(2)})`,
        { variant: 'error' }
      );
      return;
    }

    try {
      // 🔄 Convert category and location name to ID
      const categoryId = categories.find((cat) => cat.name === updatedPurchase.category)?.id;

      if (!categoryId) {
        enqueueSnackbar('Invalid category or location', { variant: 'error' });
        return;
      }

      const productLocationData = [];

      for (const entry of updatedPurchase.locations) {
        const locationId = locations.find((loc) => loc.name === entry.location.name)?.id;
        if (!locationId) {
          enqueueSnackbar(`Invalid location: ${entry.location.name}`, { variant: 'error' });
          return;
        }

        productLocationData.push({ location_id: locationId, quantity: entry.quantity });
      }

      const formData = new FormData();

      formData.append('unique_id', updatedPurchase.uniqueId);
      formData.append('item_name', updatedPurchase.itemName);
      formData.append('brand', updatedPurchase.brand);
      formData.append('serial_number', updatedPurchase.serialNumber);
      formData.append('variants', updatedPurchase.variants);
      formData.append('category_id', String(categoryId));
      formData.append('rate', String(updatedPurchase.rate));
      formData.append('selling_price', String(updatedPurchase.sellingPrice));
      formData.append('locations', JSON.stringify(productLocationData));
      formData.append('active', String(updatedPurchase.active));
      formData.append('description', updatedPurchase.description || '');
      
      // Only append image if it's a new File (not a URL string)
      if (updatedPurchase.image instanceof File) {
        formData.append('image', updatedPurchase.image);
      }

      console.log('✅ Payload to update:', formData);

      await updateProduct(updatedPurchase.id.toString(), formData, true);

      enqueueSnackbar('Product updated successfully!', { variant: 'success' });
      setIsEditing(false);
      onEdit?.({ ...updatedPurchase, category: updatedPurchase.category });
    } catch (error: any) {
      console.error('❌ Failed to update product:', error);
      if (error.response) {
        console.error('📩 Backend response:', error.response.data);
      }
      enqueueSnackbar('Failed to update product.', { variant: 'error' });
    }
  };

  const handleCancel = () => {
    setUpdatedPurchase(row);
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
              src={
                imageError
                  ? '/assets/images/fallback-image.png'
                  : previewUrl ?? (typeof updatedPurchase.image === 'string' ? updatedPurchase.image : '')
              }
              alt={row.itemName}
              variant="rounded"
              sx={{ width: 48, height: 48, cursor: 'pointer' }}
              onClick={handleImageClick}
              onError={() => setImageError(true)}
            />
        </TableCell>

        <TableCell>
          <Button variant="text" onClick={() => onShowBarcode(row)}>
            {row.uniqueId}
          </Button>
        </TableCell>

        <TableCell 
          sx={{
            minWidth: { xs: 120, sm: 160 },
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Button
            variant="text"
            size="small"
            onClick={() => handleItemClick(row.description || '')}
            sx={{ textTransform: 'none', padding: 0, minWidth: 'unset' }}
          >
            {row.itemName}
          </Button>
        </TableCell>

        <TableCell>{row.brand}</TableCell>
          
        <TableCell>{row.serialNumber}</TableCell>
          
        <TableCell>{row.variants}</TableCell>

        <TableCell> {row.category} </TableCell>
          
        <TableCell> {row.rate} </TableCell>

        <TableCell>
          {row.sellingPrice}
          {(row.sellingPrice < row.rate + (row.minimumProfit ?? 10)) && (
            <Tooltip title="Selling price is below required minimum" arrow>
              <WarningIcon fontSize="small" color="error" style={{ marginLeft: 4 }} />
            </Tooltip>
          )}
        </TableCell>

        <TableCell>
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => setLocationPopoverAnchor(e.currentTarget)}
            >
              {row.total_quantity}
            </Button>
            <Popover
              open={Boolean(locationPopoverAnchor)}
              anchorEl={locationPopoverAnchor}
              onClose={() => setLocationPopoverAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <List dense sx={{ p: 1, minWidth: 200 }}>
                {row.locations?.map((loc, i) => (
                  <ListItem key={i}>
                    <ListItemText
                      primary={loc.location.name}
                      secondary={`Qty: ${loc.quantity}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Popover>
          </>
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
                Update
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
            src={
              imageError
                ? '/assets/images/fallback-image.png'
                : previewUrl ?? (typeof updatedPurchase.image === 'string' ? updatedPurchase.image : '')
            }
            alt={row.itemName}
            sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={descriptionOpen} onClose={() => setDescriptionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Product Description</DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: 'pre-wrap' }}>
            {descriptionText || 'No description available.'}
          </Box>
        </DialogContent>
      </Dialog>
      <PurchaseEditDialog
        open={editDialogOpen}
        product={purchaseToEdit}
        categories={categories}
        locations={locations}
        onClose={() => {
          setEditDialogOpen(false);
          setPurchaseToEdit(null);
        }}
        onSuccess={(purchaseToUpdate) => {
          setEditDialogOpen(false);
          setPurchaseToEdit(null);
          updatePurchaseInTable(purchaseToUpdate);
        }}
      />
    </>
  );
}
