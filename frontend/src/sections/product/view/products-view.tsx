import type { ProductProps } from 'src/sections/product/product-table-row';

import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { getProducts, deleteProduct, getCategories, getLocations } from 'src/api/products';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/product/table-no-data';
import NewProductDialog from 'src/sections/product/new-product-dialog';
import { TableEmptyRows } from 'src/sections/product/table-empty-rows';
import { ProductTableRow } from 'src/sections/product/product-table-row';
import { ProductTableHead } from 'src/sections/product/product-table-head';
import { ProductTableToolbar } from 'src/sections/product/product-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/product/utils';

import { useSnackbar } from 'notistack';

export function ProductView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);



  const fetchProducts = useCallback(() => {
    setLoading(true);
    getProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch((error) => {
        console.error('❌ Failed to fetch products', error);
        enqueueSnackbar('Failed to fetch products', { variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchProducts();

    getCategories()
      .then(setCategories)
      .catch((err) => {
        console.error('❌ Failed to fetch categories', err);
        enqueueSnackbar('Failed to fetch categories', { variant: 'error' });
      });

    getLocations()
      .then(setLocations)
      .catch((err) => {
        console.error('❌ Failed to fetch locations', err);
        enqueueSnackbar('Failed to fetch locations', { variant: 'error' });
      });
  }, [fetchProducts]);

  if (loading) return <CircularProgress />;

  const dataFiltered: ProductProps[] = applyFilter<ProductProps>({
    inputData: Array.isArray(products) ? products : [],
    comparator: getComparator<ProductProps>(table.order, table.orderBy as keyof ProductProps),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleNewProductSuccess = () => {
    setOpenNewProduct(false);
    fetchProducts();
  };

  // Handle product delete
  const handleDeleteProduct = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (!confirm) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
      // Also clear selection if selected
      table.onSelectRow(id);
    } catch (error) {
      console.error('❌ Failed to delete product', error);
      enqueueSnackbar('Failed to delete product.', { variant: 'error' });
    }
  };

  // Handle product update (after inline editing saved)
  const handleUpdateProductInList = (updatedProduct: ProductProps) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    enqueueSnackbar('Product updated successfully!', { variant: 'success' });
  };

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ md: 12 }}>
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              Products
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenNewProduct(true)}
            >
              New Product
            </Button>
          </Box>
          <NewProductDialog
            open={openNewProduct}
            onClose={() => setOpenNewProduct(false)}
            onSuccess={handleNewProductSuccess}
          />
          <Card>
            <ProductTableToolbar
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
                  <ProductTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={products.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        products.map((item: ProductProps) => item.id)
                      )
                    }
                    headLabel={[
                      { id: 'serial', label: '#' },
                      { id: 'image', label: 'Image' },
                      { id: 'uniqueId', label: 'Unique ID' },
                      { id: 'itemName', label: 'Item Name' },
                      { id: 'brand', label: 'Brand' },
                      { id: 'serialNumber', label: 'Serial No.' },
                      { id: 'variants', label: 'Variants' },
                      { id: 'category', label: 'Category' },
                      { id: 'rate', label: 'Rate' },
                      { id: 'quantity', label: 'Qty' },
                      { id: 'location', label: 'Location' },
                      { id: 'active', label: 'Active', align: 'center' },
                      { id: '' },
                    ]}
                  />
                  <TableBody>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row, index) => (
                        <ProductTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          serial={index + 1 + table.page * table.rowsPerPage}
                          categories={categories}
                          locations={locations}

                          // Pass delete callback
                          onDelete={handleDeleteProduct}

                          // Pass update callback for inline edit save
                          onEdit={handleUpdateProductInList}
                        />
                      ))}
                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, products.length)}
                    />
                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              page={table.page}
              count={products.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              rowsPerPageOptions={[5, 10, 25]}
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
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
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
