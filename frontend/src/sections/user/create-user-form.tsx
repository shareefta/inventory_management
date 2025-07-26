import axios from 'axios';
import { useState } from 'react';

import {
  TextField, Button, MenuItem, Box, Typography
} from '@mui/material';

const roles = ['admin', 'management', 'staff', 'delivery', 'counter'];

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'staff',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token'); // JWT token

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('https://razaworld.uk/api/accounts/create/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess(true);
      setError('');
      console.log('Access token:', token);
    } catch (err: any) {
      setSuccess(false);
      setError(err.response?.data?.detail || 'Error creating user');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>Create New User</Typography>

      <TextField label="Username" name="username" fullWidth margin="normal" onChange={handleChange} />
      <TextField label="Password" name="password" type="password" fullWidth margin="normal" onChange={handleChange} />
      <TextField label="Email" name="email" type="email" fullWidth margin="normal" onChange={handleChange} />
      <TextField
        select
        label="Role"
        name="role"
        fullWidth
        margin="normal"
        value={formData.role}
        onChange={handleChange}
      >
        {roles.map((role) => (
          <MenuItem key={role} value={role}>{role}</MenuItem>
        ))}
      </TextField>

      <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
        Create User
      </Button>

      {success && <Typography color="green" mt={2}>User created successfully!</Typography>}
      {error && <Typography color="red" mt={2}>{error}</Typography>}
    </Box>
  );
}
