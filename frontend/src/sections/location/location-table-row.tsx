import { useState } from 'react';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { updateLocation } from 'src/api/location';

import { Iconify } from 'src/components/iconify';

import LocationEditDialog from 'src/sections/location/location-edit-dialog'; 

// ----------------------------------------------------------------------
export type LocationEntry = {
  id: number;
  name: string;
};

export type LocationProps = {
  id: number;
  name: string;
};

type LocationTableRowProps = {
  row: LocationProps;
  selected: boolean;
  onSelectRow: () => void;
  serial: number;
  onEdit?: (updatedLocation: LocationProps) => void;
  onDelete?: (id: number) => void;
  locations: { id: number; name: string }[];
};

export function LocationTableRow({
  row,
  selected,
  onSelectRow,
  serial,
  onEdit,
  onDelete,
}: LocationTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedLocation, setUpdatedLocation] = useState(row);
  const { enqueueSnackbar } = useSnackbar();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationProps | null>(null);
  const [locations, setLocation] = useState<LocationProps[]>([]);

  const updateLocationInTable = (locationToUpdate: LocationProps) => {
    setLocation((prevLocation) =>
      prevLocation.map((l) => (l.id === locationToUpdate.id ? locationToUpdate : l))
    );
  };

  const handleOpenPopover = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  };

  const handleClosePopover = () => {
    setOpenPopover(null);
  };

  const handleSave = async () => {
    try {
      // 🔄 Convert location name to ID
      const locationId = locations.find((loc) => loc.name === updatedLocation.name)?.id;

      if (!locationId) {
        enqueueSnackbar('Invalid location', { variant: 'error' });
        return;
      }

      const formData = new FormData();

      formData.append('name', updatedLocation.name);
      
      console.log('✅ Payload to update:', formData);

      await updateLocation(updatedLocation.id, {
        name: updatedLocation.name,
      });

      enqueueSnackbar('Location updated successfully!', { variant: 'success' });
      setIsEditing(false);
      onEdit?.({ ...updatedLocation, name: updatedLocation.name });
    } catch (error: any) {
      console.error('❌ Failed to update location:', error);
      if (error.response) {
        console.error('📩 Backend response:', error.response.data);
      }
      enqueueSnackbar('Failed to update location.', { variant: 'error' });
    }
  };

  const handleCancel = () => {
    setUpdatedLocation(row);
    setIsEditing(false);
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell>{serial}</TableCell>

        <TableCell>{row.name}</TableCell>

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
              setLocationToEdit(row);
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

      <LocationEditDialog
        open={editDialogOpen}
        location={locationToEdit}
        locations={locations}
        onClose={() => {
          setEditDialogOpen(false);
          setLocationToEdit(null);
        }}
        onSuccess={(locationToUpdate) => {
          setEditDialogOpen(false);
          setLocationToEdit(null);
          updateLocationInTable(locationToUpdate);
        }}
      />
    </>
  );
}
