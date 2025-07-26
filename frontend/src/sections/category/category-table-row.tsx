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

import { updateCategory } from 'src/api/category';

import { Iconify } from 'src/components/iconify';

import CategoryEditDialog from 'src/sections/category/category-edit-dialog'; 

// ----------------------------------------------------------------------
export type CategoryEntry = {
  id: number;
  name: string;
};

export type CategoryProps = {
  id: number;
  name: string;
  description?: string;
};

type CategoryTableRowProps = {
  row: CategoryProps;
  selected: boolean;
  onSelectRow: () => void;
  serial: number;
  onEdit?: (updatedCategory: CategoryProps) => void;
  onDelete?: (id: number) => void;
  categories: { id: number; name: string }[];
};

export function CategoryTableRow({
  row,
  selected,
  onSelectRow,
  serial,
  onEdit,
  onDelete,
  categories,
}: CategoryTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedCategory, setUpdatedCategory] = useState(row);
  const { enqueueSnackbar } = useSnackbar();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryProps | null>(null);
  const [cetegories, setCategory] = useState<CategoryProps[]>([]);

  const updateCategoryInTable = (categoryToUpdate: CategoryProps) => {
    setCategory((prevCategory) =>
      prevCategory.map((p) => (p.id === categoryToUpdate.id ? categoryToUpdate : p))
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
      // 🔄 Convert category and location name to ID
      const categoryId = categories.find((cat) => cat.name === updatedCategory.name)?.id;

      if (!categoryId) {
        enqueueSnackbar('Invalid category or location', { variant: 'error' });
        return;
      }

      const formData = new FormData();

      formData.append('name', updatedCategory.name);
      formData.append('description', updatedCategory.description || '');
      
      console.log('✅ Payload to update:', formData);

      await updateCategory(updatedCategory.id, {
        name: updatedCategory.name,
        description: updatedCategory.description ?? '',
      });

      enqueueSnackbar('Category updated successfully!', { variant: 'success' });
      setIsEditing(false);
      onEdit?.({ ...updatedCategory, name: updatedCategory.name });
    } catch (error: any) {
      console.error('❌ Failed to update category:', error);
      if (error.response) {
        console.error('📩 Backend response:', error.response.data);
      }
      enqueueSnackbar('Failed to update category.', { variant: 'error' });
    }
  };

  const handleCancel = () => {
    setUpdatedCategory(row);
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
              setCategoryToEdit(row);
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

      <CategoryEditDialog
        open={editDialogOpen}
        category={categoryToEdit}
        categories={categories}
        onClose={() => {
          setEditDialogOpen(false);
          setCategoryToEdit(null);
        }}
        onSuccess={(categoryToUpdate) => {
          setEditDialogOpen(false);
          setCategoryToEdit(null);
          updateCategoryInTable(categoryToUpdate);
        }}
      />
    </>
  );
}
