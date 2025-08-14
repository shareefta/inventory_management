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
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [applyToAll, setApplyToAll] = useState(false); // ✅ new checkbox state

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const totalPages = Math.ceil(products.length / perPage);
  const maxButtons = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsRes = await getSections();
        setSections(sectionsRes.data);
        const productsRes = await getProducts();
        setProducts(productsRes);
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to fetch sections or products', { variant: 'error' });
      }
    };
    fetchData();
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (!selectedSectionId) return;
    const fetchPrices = async () => {
      try {
        const res = await getSectionPrices(selectedSectionId);
        const priceMap: Record<string, string> = {};
        res.forEach((item: SectionProductPrice) => {
          priceMap[String(item.product)] = item.price;
        });
        setPrices((prev) => {
          const next = { ...priceMap };
          products.forEach((p) => {
            if (next[p.id] === undefined) {
              next[p.id] = p.rate != null ? String(p.rate) : '';
            }
          });
          return next;
        });
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Failed to fetch section prices', { variant: 'error' });
      }
    };
    fetchPrices();
  }, [selectedSectionId, products, enqueueSnackbar]);

  const handlePriceChange = (productId: string, value: string) => {
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
      price: prices[p.id] || '0',
    }));

    try {
      if (applyToAll) {
        // Collect all section IDs in one array
        const allSectionIds = sections.map((sec) => sec.id);
        await bulkSetSectionPrices(allSectionIds, items);

        enqueueSnackbar('Prices applied to all sections successfully!', { variant: 'success' });
      } else {
        await bulkSetSectionPrices(Number(selectedSectionId), items);
        enqueueSnackbar('Page prices saved successfully!', { variant: 'success' });
      }

      if (page < totalPages) {
        setPage(page + 1);
      } else {
        enqueueSnackbar('All pages are done!', { variant: 'info' });
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to save page prices', { variant: 'error' });
    }
  };

  const getPaginationButtons = () => {
    if (totalPages <= maxButtons) return [...Array(totalPages)].map((_, i) => i + 1);
    let start = Math.max(page - Math.floor(maxButtons / 2), 1);
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }
    return [...Array(end - start + 1)].map((_, i) => start + i);
  };

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/settings')}>
          Settings
        </Link>
        <Typography>Set Section Prices</Typography>
      </Breadcrumbs>

      <Typography variant="h6" gutterBottom>
        Set Selling Prices for Sections
      </Typography>

      {/* Section selector, checkbox & Save Button */}
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
          {/* Section Selector */}
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

          {/* Apply to All */}
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

          {/* Save Button */}
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

          {/* Per Page Selector */}
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

      {/* Products Table */}
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
          <TableHead
            sx={{
              position: 'sticky',
              top: 20,
              zIndex: 1100,
            }}
          >
            <TableRow sx={{ background: 'linear-gradient(90deg, #1f1f1f, #3a3a3a)' }}>
              {['SL No', 'Barcode', 'Product Name', 'Model Number', 'Rate', 'Selling Price'].map((head) => (
                <TableCell
                  key={head}
                  sx={{
                    color: 'black',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid #444',
                  }}
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {products.slice((page - 1) * perPage, page * perPage).map((product, index) => (
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
                    value={prices[product.id] ?? ''}
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>

        {page > Math.floor(maxButtons / 2) && (
          <>
            <Button variant={page === 1 ? 'contained' : 'outlined'} size="small" onClick={() => setPage(1)}>
              1
            </Button>
            {page > Math.floor(maxButtons / 2) + 1 && <span>...</span>}
          </>
        )}

        {getPaginationButtons().map((num) => (
          <Button
            key={num}
            variant={num === page ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setPage(num)}
          >
            {num}
          </Button>
        ))}

        {page < totalPages - Math.floor(maxButtons / 2) && (
          <>
            {page < totalPages - Math.floor(maxButtons / 2) - 1 && <span>...</span>}
            <Button
              variant={page === totalPages ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
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
