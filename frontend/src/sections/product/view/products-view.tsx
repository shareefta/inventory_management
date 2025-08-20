import type { ProductProps } from 'src/sections/product/product-table-row';

import { useSnackbar } from 'notistack';
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
import { Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import { getProducts, deleteProduct, getCategories, getLocations, getProductByBarcode, downloadProductsExcel } from 'src/api/products';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import BarcodeDialog from 'src/sections/product/barcode';
import { TableNoData } from 'src/sections/product/table-no-data';
import BarcodeScanner from 'src/sections/product/barcode-scanner';
import NewProductDialog from 'src/sections/product/new-product-dialog';
import { TableEmptyRows } from 'src/sections/product/table-empty-rows';
import ProductEditDialog from 'src/sections/product/product-edit-dialog';
import { ProductTableRow } from 'src/sections/product/product-table-row';
import { ProductTableHead } from 'src/sections/product/product-table-head';
import { ProductTableToolbar } from 'src/sections/product/product-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/product/utils';

const columns = [
  { key: 'unique_id', label: 'Product ID' },
  { key: 'item_name', label: 'Item Name' },
  { key: 'brand', label: 'Brand' },
  { key: 'serial_number', label: 'Model No.' },
  { key: 'variants', label: 'Variants' },
  { key: 'category', label: 'Category' },
  { key: 'rate', label: 'Rate' },
  { key: 'active', label: 'Active' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Created At' },
];

export function ProductView() {
  const table = useTable(25);
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [openNewProduct, setOpenNewProduct] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const [productToEdit, setProductToEdit] = useState<ProductProps | null>(null);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);

  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<ProductProps | null>(null);

  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(columns.map(c => c.key));

  // -----------------------------
  // Fetch Products from API
  // -----------------------------
  const fetchProducts = useCallback(
    async (pageParam = table.page, limitParam = table.rowsPerPage, search = filterName) => {
      setLoading(true);
      try {
        const { data, total } = await getProducts(pageParam + 1, limitParam, search);
        setProducts(data);
        setTotalProducts(total);
      } catch (error) {
        console.error('❌ Failed to fetch products', error);
        enqueueSnackbar('Failed to fetch products', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [enqueueSnackbar, table.page, table.rowsPerPage, filterName]
  );

  // -----------------------------
  // Fetch categories and locations
  // -----------------------------
  useEffect(() => {
    fetchProducts();

    getCategories()
      .then(setCategories)
      .catch(err => enqueueSnackbar('Failed to fetch categories', { variant: 'error' }));

    getLocations()
      .then(setLocations)
      .catch(err => enqueueSnackbar('Failed to fetch locations', { variant: 'error' }));
  }, [enqueueSnackbar, fetchProducts]);

  // -----------------------------
  // Filtered products with total quantity
  // -----------------------------
  const productsWithTotalQuantity = products.map(product => ({
    ...product,
    total_quantity: (product.locations ?? []).reduce((acc, loc) => acc + loc.quantity, 0),
  }));

  const dataFiltered: ProductProps[] = applyFilter({
    inputData: productsWithTotalQuantity,
    comparator: getComparator(table.order, table.orderBy as keyof ProductProps),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleNewProductSuccess = () => {
    setOpenNewProduct(false);
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      table.onSelectRow(id); // remove selection if selected
      enqueueSnackbar('Product deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('❌ Failed to delete product', error);
      enqueueSnackbar('Failed to delete product', { variant: 'error' });
    }
  };

  const handleUpdateProductInList = (updated: ProductProps) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    enqueueSnackbar(`Product updated: ${updated.itemName} (${updated.uniqueId})`, { variant: 'success' });
  };

  const handleShowBarcode = (product: ProductProps) => {
    setSelectedProductForBarcode(product);
    setBarcodeDialogOpen(true);
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleDownload = async () => {
    try {
      await downloadProductsExcel(filterName, selectedColumns);
      setDownloadDialogOpen(false);
    } catch (error) {
      console.error('Failed to download Excel', error);
      enqueueSnackbar('Failed to download Excel', { variant: 'error' });
    }
  };

  // -----------------------------
  // Table Head Labels
  // -----------------------------
  const headLabel = [
    { id: 'serial', label: '#', disableSorting: true },
    { id: 'image', label: 'Image', disableSorting: true },
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

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ sm: 12 }} >
          {/* Header */}
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>Products</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenNewProduct(true)}
            >
              New Product
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={() => setDownloadDialogOpen(true)}
            >
              Excel
            </Button>
          </Box>

          {/* New Product Dialog */}
          <NewProductDialog
            open={openNewProduct}
            onClose={() => { setOpenNewProduct(false); setScannedBarcode(null); }}
            onSuccess={handleNewProductSuccess}
            initialBarcode={scannedBarcode ?? undefined}
          />

          {/* Barcode Scanner */}
          <BarcodeScanner
            onProductFound={async (scannedProduct) => {
              enqueueSnackbar(`Product found: ${scannedProduct.item_name}`, { variant: 'info' });

              try {
                // Fetch full product details using barcode
                const fullProduct = await getProductByBarcode(scannedProduct.unique_id);

                // Open edit form with the full product
                setProductToEdit(fullProduct);
                setEditProductDialogOpen(true);
              } catch (error) {
                enqueueSnackbar('Failed to load product details', { variant: 'error' });
                console.error(error);
              }
            }}
            onNotFound={(barcode) => {
              enqueueSnackbar(`Product not found: ${barcode}`, { variant: 'warning' });
              setScannedBarcode(barcode);
              setOpenNewProduct(true);
            }}
          />

          {/* Product Edit Dialog */}
          {productToEdit && (
            <ProductEditDialog
              open={editProductDialogOpen}
              product={productToEdit}
              onClose={() => { setEditProductDialogOpen(false); setProductToEdit(null); }}
              onSuccess={(updated) => { handleUpdateProductInList(updated); setEditProductDialogOpen(false); setProductToEdit(null); fetchProducts(); }}
              categories={categories}
              locations={locations}
            />
          )}

          {/* Table */}
          <Card>
            <ProductTableToolbar
              numSelected={table.selected.length}
              filterName={filterName}
              onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFilterName(event.target.value);
                table.onResetPage(); 
                fetchProducts(0, table.rowsPerPage, event.target.value);
              }}
            />

            <Scrollbar>
              <TableContainer sx={{ minWidth: '100%' }}>
                <Table sx={{ width: '100%', tableLayout: 'auto' }}>
                  <ProductTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={totalProducts}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) => table.onSelectAllRows(checked, products.map(p => p.id))}
                    headLabel={headLabel}
                  />

                  <TableBody>
                    {loading ? (
                      <tr>
                        <td colSpan={headLabel.length} style={{ textAlign: 'center', padding: 20 }}>
                          <CircularProgress size={24} />
                        </td>
                      </tr>
                    ) : (
                      products.map((row, index) => (
                        <ProductTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          serial={index + 1 + table.page * table.rowsPerPage}
                          categories={categories}
                          locations={locations}
                          onDelete={handleDeleteProduct}
                          onEdit={handleUpdateProductInList}
                          handleShowBarcode={handleShowBarcode}
                        />
                      ))
                    )}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, totalProducts)}
                    />

                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalProducts}
              page={table.page}
              rowsPerPage={table.rowsPerPage}
              onPageChange={(e, newPage) => {
                table.onChangePage(e, newPage);
                fetchProducts(newPage, table.rowsPerPage);
              }}
              rowsPerPageOptions={[25, 50, 100]}
              onRowsPerPageChange={(event) => {
                const target = event.target as HTMLInputElement;
                const newRowsPerPage = parseInt(target.value, 10);

                table.onChangeRowsPerPage(event);
                table.onResetPage();

                fetchProducts(0, newRowsPerPage);
              }}
            />
          </Card>
        </Grid>
      </Grid>

      {selectedProductForBarcode && (
        <BarcodeDialog
          open={barcodeDialogOpen}
          onClose={() => setBarcodeDialogOpen(false)}
          product={selectedProductForBarcode}
        />
      )}

      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>Select Columns to Export</DialogTitle>
        <DialogContent>
          <FormGroup>
            {columns.map(col => (
              <FormControlLabel
                key={col.key}
                control={
                  <Checkbox
                    checked={selectedColumns.includes(col.key)}
                    onChange={() => toggleColumn(col.key)}
                  />
                }
                label={col.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDownload}>Download</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

// -----------------------------
// useTable hook
// -----------------------------
function useTable(initialRowsPerPage = 25) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState('itemName');
  const [selected, setSelected] = useState<string[]>([]);

  const onResetPage = useCallback(() => setPage(0), []);

  const onChangePage = useCallback((_: unknown, newPage: number) => setPage(newPage), []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fetch?: () => void) => {
      const target = event.target as HTMLInputElement;
      const newRowsPerPage = parseInt(target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPage(0); // reset to first page

      // Fetch immediately after state updated
      if (fetch) fetch();
    },
    []
  );

  const onSelectRow = useCallback((id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    setSelected(checked ? newSelecteds : []);
  }, []);

  const onSort = useCallback((id: string) => {
    setOrder(orderBy === id && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(id);
  }, [order, orderBy]);

  return {
    page,
    rowsPerPage,
    order,
    orderBy,
    selected,
    onSort,
    onSelectRow,
    onSelectAllRows,
    onResetPage,
    onChangePage,
    onChangeRowsPerPage,
  };
}
