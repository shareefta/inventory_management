import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

import { getLocations } from 'src/api/products';
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  SalesSection,
  getChannels,
  SalesChannel,
} from 'src/api/sales';

interface Location {
  id: number;
  name: string;
}

export default function SalesSectionsPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [sections, setSections] = useState<SalesSection[]>([]);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newChannelId, setNewChannelId] = useState<number | ''>('');
  const [newLocationId, setNewLocationId] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingChannelId, setEditingChannelId] = useState<number | ''>('');
  const [editingLocationId, setEditingLocationId] = useState<number | ''>('');

  const fetchSections = async () => {
    try {
      const res = await getSections();
      setSections(res.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to fetch sections', { variant: 'error' });
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await getChannels();
      setChannels(res.data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to fetch channels', { variant: 'error' });
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to fetch locations', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchSections();
    fetchChannels();
    fetchLocations();
  }, []);

  const handleAdd = async () => {
    if (!newSectionName || !newChannelId || !newLocationId) {
      enqueueSnackbar('Please fill all fields', { variant: 'warning' });
      return;
    }

    try {
      await createSection({
        name: newSectionName,
        channel_id: Number(newChannelId),
        location: Number(newLocationId),
      });
      enqueueSnackbar('Section added successfully!', { variant: 'success' });
      setNewSectionName('');
      setNewChannelId('');
      setNewLocationId('');
      fetchSections();
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(
        error.response?.data?.location
          ? `Error: ${error.response.data.location[0]}`
          : 'Failed to add section',
        { variant: 'error' }
      );
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingName || !editingChannelId || !editingLocationId) {
      enqueueSnackbar('Please fill all fields', { variant: 'warning' });
      return;
    }

    try {
      await updateSection(id, {
        name: editingName,
        channel_id: Number(editingChannelId),
        location: Number(editingLocationId),
      });
      enqueueSnackbar('Section updated successfully!', { variant: 'success' });
      setEditingId(null);
      setEditingName('');
      setEditingChannelId('');
      setEditingLocationId('');
      fetchSections();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to update section', { variant: 'error' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    try {
      await deleteSection(id);
      enqueueSnackbar('Section deleted successfully!', { variant: 'success' });
      fetchSections();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Failed to delete section', { variant: 'error' });
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/settings')}>
          Settings
        </Link>
        <Typography>Sales Sections</Typography>
      </Breadcrumbs>

      <Typography variant="h6" gutterBottom>
        Sales Sections
      </Typography>

      {/* Add Section Box */}
      <Box
        sx={{
          maxWidth: 700, // match table width
          // mx: 'auto', // center horizontally
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            p: 2,
            background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            borderRadius: 2,
            boxShadow: 3,
            alignItems: 'center',
          }}
        >
          <TextField
            label="New Section Name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            size="small"
            sx={{ backgroundColor: 'white', borderRadius: 1 }}
          />

          <FormControl
            size="small"
            sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}
          >
            <InputLabel>Channel</InputLabel>
            <Select
              value={newChannelId}
              label="Channel"
              onChange={(e) => setNewChannelId(Number(e.target.value))}
            >
              {channels.map((ch) => (
                <MenuItem key={ch.id} value={ch.id}>
                  {ch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}
          >
            <InputLabel>Location</InputLabel>
            <Select
              value={newLocationId}
              label="Location"
              onChange={(e) => setNewLocationId(Number(e.target.value))}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="secondary"
            sx={{
              backgroundColor: '#6a11cb',
              color: 'white',
              '&:hover': { backgroundColor: '#2575fc' },
            }}
            onClick={handleAdd}
          >
            Add Section
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: 700,
          // mx: 'auto', // center horizontally
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: '#f3f6f9',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #ff416c, #ff4b2b)' }}>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>SL No</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>Name</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>Channel</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>Location</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section, index) => (
              <TableRow
                key={section.id}
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f0f4f8',
                  '&:hover': { backgroundColor: '#e8f0fe' },
                }}
              >
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell align="center">
                  {editingId === section.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                    />
                  ) : (
                    section.name
                  )}
                </TableCell>
                <TableCell align="center">
                  {editingId === section.id ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editingChannelId}
                        onChange={(e) => setEditingChannelId(Number(e.target.value))}
                      >
                        {channels.map((ch) => (
                          <MenuItem key={ch.id} value={ch.id}>
                            {ch.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    section.channel.name
                  )}
                </TableCell>
                <TableCell align="center">
                  {editingId === section.id ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editingLocationId}
                        onChange={(e) => setEditingLocationId(Number(e.target.value))}
                      >
                        {locations.map((loc) => (
                          <MenuItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    // <-- FIXED: map ID to name
                    locations.find((loc) => loc.id === section.location)?.name || '—'
                  )}
                </TableCell>
                <TableCell align="center">
                  {editingId === section.id ? (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleUpdate(section.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                          setEditingChannelId('');
                          setEditingLocationId('');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          setEditingId(section.id);
                          setEditingName(section.name);
                          setEditingChannelId(section.channel.id);
                          setEditingLocationId(Number(section.location || ''));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(section.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
