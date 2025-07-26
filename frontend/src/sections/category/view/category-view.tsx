import type { CategoryProps } from 'src/sections/category/category-table-row';

import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { getCategories } from 'src/api/products';
import { deleteCategory } from 'src/api/category';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/product/table-no-data';
import { TableEmptyRows } from 'src/sections/product/table-empty-rows';
import NewCategoryDialog from 'src/sections/category/new-category-dialog';
import { CategoryTableRow } from 'src/sections/category/category-table-row';
import { CategoryTableHead } from 'src/sections/category/category-table-head';
import { CategoryTableToolbar } from 'src/sections/category/category-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/category/utils';

export function CategoryView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewCategory, setOpenNewCategory] = useState(false);

  const fetchCategories = useCallback(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error('❌ Failed to fetch categories', error);
        enqueueSnackbar('Failed to fetch categories', { variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Loading Categories...
        </Typography>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={50} sx={{ mb: 2 }} />
        ))}
      </Container>
    );
  }

  const handleNewCategorySuccess = () => {
    setOpenNewCategory(false);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    const confirm = window.confirm('Are you sure you want to delete this category?');
    if (!confirm) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      table.onSelectRow(id.toString());
      enqueueSnackbar('Category deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('❌ Failed to delete category', error);
      enqueueSnackbar('Failed to delete category.', { variant: 'error' });
    }
  };

  // Handle category update (after inline editing saved)
  const handleUpdateCategoryInList = (updatedCategory: CategoryProps) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
    enqueueSnackbar('Category updated successfully!', { variant: 'success' });
  };

  // Updated headLabel with disableSorting flags for non-sortable columns
  const headLabel = [
    { id: 'serial', label: '#', disableSorting: true },
    { id: 'name', label: 'Categroy Name' },
    { id: '', disableSorting: true },
  ];

  // Apply filtering and sorting
  const dataFiltered: CategoryProps[] = applyFilter<CategoryProps>({
    inputData: categories,
    comparator: getComparator<CategoryProps>(table.order, table.orderBy as keyof CategoryProps),
    filterName,
  });
  
  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ sm: 9 }}>
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              Categories
            </Typography>            
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenNewCategory(true)}
            >
              New Category
            </Button>
          </Box>

          <NewCategoryDialog
            open={openNewCategory}
            onClose={() => setOpenNewCategory(false)}
            onSuccess={handleNewCategorySuccess}
          />

          <Card>
            <CategoryTableToolbar
              numSelected={table.selected.length}
              filterName={filterName}
              onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFilterName(event.target.value);
                table.onResetPage();
              }}
            />
            <Scrollbar>
              <TableContainer sx={{ minWidth: '100%' }}>
                <Table sx={{ width: '100%', tableLayout: 'auto' }}>
                  <CategoryTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={categories.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        categories.map((item: CategoryProps) => item.id.toString())
                      )
                    }
                    headLabel={headLabel}
                  />
                  <TableBody>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row, index) => (
                        <CategoryTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(String(row.id))}
                          onSelectRow={() => table.onSelectRow(String(row.id))}
                          serial={index + 1 + table.page * table.rowsPerPage}
                          categories={categories}

                          // Pass delete callback
                          onDelete={handleDeleteCategory}

                          // Pass update callback for inline edit save
                          onEdit={handleUpdateCategoryInList}
                        />
                      ))}
                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, categories.length)}
                    />
                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              page={table.page}
              count={categories.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              rowsPerPageOptions={[5, 10, 50]}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </Card>
        </Grid>
      </Grid>      
    </DashboardContent>
  );
}

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('itemName');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // List of valid sortable keys (should match your ProductProps keys)
  const validSortKeys = new Set([
    'name',
  ]);

  const onSort = useCallback(
    (id: string) => {
      // Guard against invalid sort keys (like serial, image, empty string)
      if (!validSortKeys.has(id)) {
        return;
      }

      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    setSelected(checked ? newSelecteds : []);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];
      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    orderBy,
    selected,
    rowsPerPage,
    onSort,
    onSelectRow,
    onSelectAllRows,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
  };
}