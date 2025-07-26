import type { LocationProps } from 'src/sections/location/location-table-row';

import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';

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

import { getLocations } from 'src/api/products';
import { deleteLocation } from 'src/api/location';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/location/table-no-data';
import { TableEmptyRows } from 'src/sections/location/table-empty-rows';
import NewLocationDialog from 'src/sections/location/new-location-dialog';
import { LocationTableRow } from 'src/sections/location/location-table-row';
import { LocationTableHead } from 'src/sections/location/location-table-head';
import { LocationTableToolbar } from 'src/sections/location/location-table-toolbar';
import { applyFilter, emptyRows, getComparator } from 'src/sections/category/utils';

export function LocationView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const [filterName, setFilterName] = useState('');
  const [locations, setLocations] = useState<LocationProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNewLocation, setOpenNewLocation] = useState(false);

  const fetchLocations = useCallback(() => {
    getLocations()
      .then((data) => {
        setLocations(data);
      })
      .catch((error) => {
        console.error('❌ Failed to fetch locations', error);
        enqueueSnackbar('Failed to fetch locations', { variant: 'error' });
      })
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Loading Locations...
        </Typography>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={50} sx={{ mb: 2 }} />
        ))}
      </Container>
    );
  }

  const handleNewLocationSuccess = () => {
    setOpenNewLocation(false);
    fetchLocations();
  };

  const handleDeleteLocation = async (id: number) => {
    const confirm = window.confirm('Are you sure you want to delete this location?');
    if (!confirm) return;
    try {
      await deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      table.onSelectRow(id.toString());
      enqueueSnackbar('Location deleted successfully!', { variant: 'success' });
    } catch (error) {
      console.error('❌ Failed to delete location', error);
      enqueueSnackbar('Failed to delete location.', { variant: 'error' });
    }
  };

  // Handle category update (after inline editing saved)
  const handleUpdateLocationInList = (updatedLocation: LocationProps) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === updatedLocation.id ? updatedLocation : l))
    );
    enqueueSnackbar('Location updated successfully!', { variant: 'success' });
  };

  // Updated headLabel with disableSorting flags for non-sortable columns
  const headLabel = [
    { id: 'serial', label: '#', disableSorting: true },
    { id: 'name', label: 'Location Name' },
    { id: '', disableSorting: true },
  ];

  // Apply filtering and sorting
  const dataFiltered: LocationProps[] = applyFilter<LocationProps>({
    inputData: locations,
    comparator: getComparator<LocationProps>(table.order, table.orderBy as keyof LocationProps),
    filterName,
  });
  
  const notFound = !dataFiltered.length && !!filterName;

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ sm: 9 }}>
          <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ flexGrow: 1 }}>
              Locations
            </Typography>            
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setOpenNewLocation(true)}
            >
              New Location
            </Button>
          </Box>

          <NewLocationDialog
            open={openNewLocation}
            onClose={() => setOpenNewLocation(false)}
            onSuccess={handleNewLocationSuccess}
          />

          <Card>
            <LocationTableToolbar
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
                  <LocationTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={locations.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        locations.map((item: LocationProps) => item.id.toString())
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
                        <LocationTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(String(row.id))}
                          onSelectRow={() => table.onSelectRow(String(row.id))}
                          serial={index + 1 + table.page * table.rowsPerPage}
                          locations={locations}

                          // Pass delete callback
                          onDelete={handleDeleteLocation}

                          // Pass update callback for inline edit save
                          onEdit={handleUpdateLocationInList}
                        />
                      ))}
                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, locations.length)}
                    />
                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              page={table.page}
              count={locations.length}
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