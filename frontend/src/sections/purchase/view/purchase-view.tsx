import type { PurchaseProps } from 'src/api/purchases';

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

import { DashboardContent } from 'src/layouts/dashboard';
import { deletePurchase, getPurchases } from 'src/api/purchases';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/purchase/table-no-data';
import { TableEmptyRows } from 'src/sections/purchase/table-empty-rows';
import NewPurchaseDialog from 'src/sections/purchase/new-purchase-dialog';
import PurchaseEditDialog from 'src/sections/purchase/purchase-edit-dialog';
import { PurchaseTableRow } from 'src/sections/purchase/purchase-table-row';
import { PurchaseTableHead } from 'src/sections/purchase/purchase-table-head';
import { PurchaseTableToolbar } from 'src/sections/purchase/purchase-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/purchase/utils';

export function PurchaseView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [purchases, setPurchase] = useState<PurchaseProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewPurchase, setOpenNewPurchase] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseProps | null>(null);
  const [editPurchaseDialogOpen, setEditPurchaseDialogOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const fetchPurchases = useCallback(() => {
    setLoading(true);
    getPurchases()
      .then((data) => {
        setPurchase(data);
      })
      .catch((error) => {
        enqueueSnackbar('Failed to fetch purchases', { variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchPurchases();
  }, [enqueueSnackbar]);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  // Apply filtering and sorting
  const dataFiltered: PurchaseProps[] = applyFilter<PurchaseProps>({
    inputData: purchases,
    comparator: getComparator<PurchaseProps>(table.order, table.orderBy as keyof PurchaseProps),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleNewPurchaseSuccess = () => {
    setOpenNewPurchase(false);
    fetchPurchases();
  };

  const handleDeletePurchase = async (id: number) => {
    const confirm = window.confirm('Are you sure you want to delete this purchase?');
    if (!confirm) return;
    try {
      await deletePurchase(id);
      setPurchase((prev) => prev.filter((p) => p.id !== id));
      table.onSelectRow(id.toString());
      enqueueSnackbar('Purchase deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('❌ Failed to delete purchase', error);
      enqueueSnackbar('Failed to delete purchase.', { variant: 'error' });
    }
  };

  // Handle product update (after inline editing saved)
  const handleUpdatePurchaseInList = (updatedPurchase: PurchaseProps) => {
    setPurchase((prev) =>
      prev.map((p) => (p.id === updatedPurchase.id ? updatedPurchase : p))
    );
    enqueueSnackbar('Purchase updated successfully!', { variant: 'success' });
  };

  const headLabel = [
  { id: 'serial', label: '#', disableSorting: true },
  { id: 'purchase_date', label: 'Purchase Date' },
  { id: 'supplier_name', label: 'Supplier' },
  { id: 'invoice_number', label: 'Invoice Number' },
  { id: 'discount', label: 'Discount' },
  { id: 'total_amount', label: 'Total Amount' },
  { id: 'payment_mode', label: 'Payment Mode' },
  { id: 'purchased_by', label: 'Purchased By'},
  { id: '', disableSorting: true },
];

  const validSortKeys = new Set([
    'supplier_name',
    'invoice_number',
    'purchase_date',
    'payment_mode',
    'discount',
    'total_amount',
    'grand_total',
    'created_at',
    'purchased_by'
  ]);

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ md: 12 }}>
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              Purchases
            </Typography>            
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenNewPurchase(true)}
            >
              New Purchase
            </Button>
          </Box>

          <NewPurchaseDialog
            open={openNewPurchase}
            onClose={() => setOpenNewPurchase(false)}
            onSuccess={handleNewPurchaseSuccess}
          />

          {purchaseToEdit && (
            <PurchaseEditDialog
              open={editPurchaseDialogOpen}
              purchaseId={purchaseToEdit.id!}
              onClose={() => {
                setEditPurchaseDialogOpen(false);
                setPurchaseToEdit(null);
              }}
              onSuccess={() => {
                setEditPurchaseDialogOpen(false);
                setPurchaseToEdit(null);
                fetchPurchases();
              }}
            />
          )}

          <Card>
            <PurchaseTableToolbar
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
                  <PurchaseTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={purchases.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        purchases.map((item) => String(item.id))
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
                        <PurchaseTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(String(row.id))}
                          onSelectRow={() => table.onSelectRow(String(row.id))}
                          serial={index + 1 + table.page * table.rowsPerPage}

                          // Pass delete callback
                          onDelete={handleDeletePurchase}

                          // Pass update callback for inline edit save
                          onEdit={handleUpdatePurchaseInList}
                        />                        
                      ))}
                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, purchases.length)}
                    />
                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              page={table.page}
              count={purchases.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              rowsPerPageOptions={[10, 25, 50]}
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

  const validSortKeys = new Set([
    'supplier_name',
    'invoice_number',
    'purchase_date',
    'discount',
    'total_amount',
    'created_at',
    'purchased_by',
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