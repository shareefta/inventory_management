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
} from '@mui/material';

import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  SalesChannel,
} from 'src/api/sales';

export default function SalesChannelsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchChannels = async () => {
    const res = await getChannels();
    setChannels(res.data);
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createChannel(newName);
    setNewName('');
    fetchChannels();
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    await updateChannel(id, editingName);
    setEditingId(null);
    setEditingName('');
    fetchChannels();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      await deleteChannel(id);
      fetchChannels();
    }
  };

  return (
    <>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" onClick={() => navigate('/settings')}>
          Settings
        </Link>
        <Typography>Sales Channels</Typography>
      </Breadcrumbs>

      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
        Sales Channels
      </Typography>

      {/* Add New Channel Card */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: '#e3f2fd', // light blue background matching table hover
          border: '1px solid #90caf9', // subtle border
          alignItems: 'center',
          maxWidth: 500,
        }}
      >
        <TextField
          label="New Channel Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff', // white input for contrast
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdd}
          sx={{
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 2,
            '&:hover': { boxShadow: 6 },
          }}
        >
          Add
        </Button>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: 500, // limit table width
          margin: '0', // center table
          boxShadow: 3, // soft shadow
          borderRadius: 2,
          backgroundColor: '#f0f4f8',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(90deg, #ff7e5f, #feb47b)',
              }}
            >
              <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>SL No</TableCell>
              <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="center" sx={{ color: 'black', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {channels.map((channel, index) => (
              <TableRow
                key={channel.id}
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffe6e1' : '#fff3e0', // very subtle striping
                  '&:hover': {
                    backgroundColor: '#ffd6b3', // light blue hover
                  },
                }}
              >
                <TableCell align="center">{index + 1}</TableCell>
                <TableCell>
                  {editingId === channel.id ? (
                    <TextField
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="small"
                    />
                  ) : (
                    channel.name
                  )}
                </TableCell>
                <TableCell align="center">
                  {editingId === channel.id ? (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleUpdate(channel.id)}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
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
                          setEditingId(channel.id);
                          setEditingName(channel.name);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(channel.id)}
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