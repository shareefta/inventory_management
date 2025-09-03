import type { ProductProps } from 'src/sections/product/product-table-row';

import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Fab from '@mui/material/Fab';
import {
  Breadcrumbs,
  Link,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

import { getProducts } from 'src/api/products';
import { getSections, SalesSection } from 'src/api/sales';
import { getSectionPrices, bulkSetSectionPrices, SectionProductPrice } from 'src/api/sales';

export default function SectionPricesPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [sections, setSections] = useState<SalesSection[]>([]);
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [prices, setPrices] = useState<Record<string, string | null>>({});
  const [applyToAll, setApplyToAll] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const totalPages = Math.ceil(totalProducts / perPage);
  const maxButtons = 5;

  // Fetch sections & products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsData = await getSections();
        setSections(sectionsData);

        const productsRes = await getProducts(page, perPage, search);
        setProducts(productsRes.data);
        setTotalProducts(productsRes.total);
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to fetch sections or products', { variant: 'error' });
      }
    };
    fetchData();
  }, [enqueueSnackbar, page, perPage, search]);

  // Fetch section prices
  useEffect(() => {
    if (!selectedSectionId) return;

    const fetchPrices = async () => {
      try {
        const res = await getSectionPrices(selectedSectionId);
        const priceMap: Record<string, string | null> = {};

        res.forEach((item: SectionProductPrice) => {
          priceMap[String(item.product)] = item.price ?? null;
        });

        // Initialize missing products with null
        products.forEach((p) => {
          if (!(p.id in priceMap)) priceMap[p.id] = null;
        });

        setPrices(priceMap);
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to fetch section prices', { variant: 'error' });
      }
    };

    fetchPrices();
  }, [selectedSectionId, products, enqueueSnackbar]);

  const handlePriceChange = (productId: string, value: string | null) => {
    setPrices((prev) => ({ ...prev, [productId]: value }));
  };

  const handleSavePage = async () => {
    if (!selectedSectionId && !applyToAll) {
      enqueueSnackbar('Please select a section', { variant: 'warning' });
      return;
    }

    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageProducts = products.slice(startIndex, endIndex);

    const items = pageProducts.map((p) => ({
      product: Number(p.id),
      price: prices[p.id] ?? null,
    }));

    try {
      if (applyToAll) {
        const allSectionIds = sections.map((sec) => sec.id);
        await bulkSetSectionPrices(allSectionIds, items);
        enqueueSnackbar('Prices applied to all sections successfully!', { variant: 'success' });
      } else {
        await bulkSetSectionPrices(Number(selectedSectionId), items);
        enqueueSnackbar('Page prices saved successfully!', { variant: 'success' });
      }

      // Auto-move to next page
      if (page < totalPages) setPage(page + 1);
      else enqueueSnackbar('All pages are done!', { variant: 'info' });
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to save page prices', { variant: 'error' });
    }
  };

  const getPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      let start = Math.max(page - 2, 1);
      const end = Math.min(start + 4, totalPages);
      if (end - start < 4) start = end - 4;

      if (start > 1) buttons.push(1, '...');
      for (let i = start; i <= end; i++) buttons.push(i);
      if (end < totalPages) buttons.push('...', totalPages);
    }
    return buttons;
  };

  return (
    <>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/settings')}>
          Settings
        </Link>
        <Typography>Set Section Prices</Typography>
      </Breadcrumbs>

      <Typography variant="h6" gutterBottom>
        Set Selling Prices for Sections
      </Typography>

      <Box
        sx={{
          maxWidth: 1000,
          mx: 'auto',
          mb: 3,
          position: 'sticky',
          top: 10,
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            p: 2,
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name or barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250, backgroundColor: 'white', borderRadius: 1 }}
          />
          <Button variant="contained" onClick={() => setPage(1)}>
            Search
          </Button>

          <FormControl size="small" sx={{ minWidth: 200, backgroundColor: 'white', borderRadius: 1 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={selectedSectionId}
              label="Section"
              onChange={(e) => setSelectedSectionId(Number(e.target.value))}
              disabled={applyToAll}
            >
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                color="primary"
              />
            }
            label="Apply to all sections"
          />

          <Button
            variant="contained"
            sx={{
              backgroundColor: '#6a11cb',
              color: 'white',
              '&:hover': { backgroundColor: '#2575fc' },
            }}
            onClick={handleSavePage}
          >
            Save This Page
          </Button>

          <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white', borderRadius: 1 }}>
            <InputLabel>Per Page</InputLabel>
            <Select value={perPage} label="Per Page" onChange={(e) => setPerPage(Number(e.target.value))}>
              {[20, 30, 50].map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          maxWidth: 1000,
          mx: 'auto',
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: '#f3f6f9',
        }}
      >
        <Table>
          <TableHead sx={{ position: 'sticky', top: 20, zIndex: 1100 }}>
            <TableRow sx={{ background: 'linear-gradient(90deg, #00f5d4, #009eaa)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
              {['SL No', 'Barcode', 'Product Name', 'Model Number', 'Rate', 'Selling Price'].map(
                (head, index, arr) => (
                  <TableCell
                    key={head}
                    sx={{
                      background: 'transparent',
                      color: '#fff',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '0.95rem',
                      borderBottom: '3px solid rgba(255,255,255,0.5)',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                      borderTopLeftRadius: index === 0 ? '8px' : 0,
                      borderTopRightRadius: index === arr.length - 1 ? '8px' : 0,
                    }}
                  >
                    {head}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {products.map((product, index) => {
              const displayPrice = prices[product.id] ?? (product.rate * 1.2).toFixed(2);
              return (
                <TableRow
                  key={product.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f0f4f8',
                    '&:hover': { backgroundColor: '#e8f0fe' },
                  }}
                >
                  <TableCell align="center">{(page - 1) * perPage + index + 1}</TableCell>
                  <TableCell align="center">{product.uniqueId}</TableCell>
                  <TableCell>{product.itemName}</TableCell>
                  <TableCell>{product.serialNumber}</TableCell>
                  <TableCell align="center">{product.rate}</TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      value={displayPrice}
                      onChange={(e) => handlePriceChange(product.id, e.target.value ? e.target.value : null)}
                      size="small"
                      sx={{
                        backgroundColor: '#fff',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#2575fc' },
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>

        {getPaginationButtons().map((num, idx) =>
          typeof num === 'number' ? (
            <Button
              key={idx}
              variant={num === page ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setPage(num)}
            >
              {num}
            </Button>
          ) : (
            <Typography key={idx} sx={{ px: 1, display: 'flex', alignItems: 'center' }}>
              {num}
            </Typography>
          ),
        )}

        <Button variant="outlined" size="small" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </Box>

      <Fab
        color="primary"
        size="small"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </Fab>
    </>
  );
}