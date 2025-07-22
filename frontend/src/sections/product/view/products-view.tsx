import type { ProductProps } from 'src/sections/product/product-table-row';

import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useRef, useState } from 'react';

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

import { DashboardContent } from 'src/layouts/dashboard';
import { getProducts, deleteProduct, getCategories, getLocations } from 'src/api/products';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/product/table-no-data';
import NewProductDialog from 'src/sections/product/new-product-dialog';
import { TableEmptyRows } from 'src/sections/product/table-empty-rows';
import { ProductTableRow } from 'src/sections/product/product-table-row';
import { ProductTableHead } from 'src/sections/product/product-table-head';
import { ProductTableToolbar } from 'src/sections/product/product-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/product/utils';

export function ProductView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [printProducts, setPrintProducts] = useState<ProductProps[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const productsToPrint = printProducts.length > 0 ? printProducts : [];

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
  }, [enqueueSnackbar]);

  if (loading) return <CircularProgress />;

  // Compute total_quantity for each product
  const productsWithTotalQuantity = products.map((product) => ({
    ...product,
    total_quantity: (product.locations ?? []).reduce((acc, loc) => acc + loc.quantity, 0),
  }));

  // Apply filtering and sorting
  const dataFiltered: ProductProps[] = applyFilter<ProductProps>({
    inputData: productsWithTotalQuantity,
    comparator: getComparator<ProductProps>(table.order, table.orderBy as keyof ProductProps),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleNewProductSuccess = () => {
    setOpenNewProduct(false);
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (!confirm) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      table.onSelectRow(id); // toggle off selection if selected
      enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
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

  // Updated headLabel with disableSorting flags for non-sortable columns
  const headLabel = [
    { id: 'serial', label: '#', disableSorting: true },
    { id: 'image', label: 'Image', disableSorting: true },
    { id: 'barcode_image', label: 'Barcode', disableSorting: true },
    { id: 'uniqueId', label: 'Product ID' },
    { id: 'itemName', label: 'Item Name' },
    { id: 'brand', label: 'Brand' },
    { id: 'serialNumber', label: 'Model No.' },
    { id: 'variants', label: 'Variants' },
    { id: 'category', label: 'Category' },
    { id: 'rate', label: 'Rate' },
    { id: 'total_quantity', label: 'Stock' },
    { id: 'active', label: 'Active', align: 'center' },
    { id: '', disableSorting: true },
  ];

  const handlePrintSingle = (product: ProductProps) => {
    setPrintProducts([product]);
  };

  // When user clicks bulk print
  const handlePrintBulk = () => {
    // Filter products where selected contains product id
    const selectedProducts = products.filter((p) => table.selected.includes(p.id));
    if (selectedProducts.length === 0) {
      enqueueSnackbar('No products selected for printing', { variant: 'warning' });
      return;
    }
    setPrintProducts(selectedProducts);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }}>
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
                    headLabel={headLabel}
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
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // List of valid sortable keys (should match your ProductProps keys)
  const validSortKeys = new Set([
    'uniqueId',
    'itemName',
    'brand',
    'serialNumber',
    'variants',
    'category',
    'rate',
    'total_quantity',
    'active',
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