import { useSnackbar } from 'notistack';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress'; // ✅ loader

import { useRouter } from 'src/routes/hooks';

import api from 'src/utils/api';

import { useAuthStore } from 'src/store/use-auth-store';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const setUser = useAuthStore((state) => state.setUser);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ loading state

  const handleSignIn = useCallback(async () => {
    setLoading(true); // start loading
    try {
      // 🔑 Get JWT tokens
      const response = await api.post('/api/token/', {
        username: userName,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);

      enqueueSnackbar('Login successful!', { variant: 'success' });

      // 👤 Fetch user profile
      const meRes = await api.get('/api/accounts/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });

      const user = meRes.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      enqueueSnackbar(`Welcome, ${user.username || 'User'}!`, { variant: 'info' });

      // 🔀 Redirect based on role
      switch ((user.role || '').toLowerCase()) {
        case 'admin':
          router.push('/');
          break;
        case 'management':
          router.push('/dashboard/management');
          break;
        case 'staff':
          router.push('/staff');
          break;
        case 'delivery':
          router.push('/dashboard/delivery');
          break;
        default:
          router.push('/sign-in');
          enqueueSnackbar('Unknown role. Please contact admin.', { variant: 'warning' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      enqueueSnackbar(error.response?.data?.detail || 'Invalid credentials or server error.', {
        variant: 'error',
      });
    } finally {
      setLoading(false); // stop loading
    }
  }, [userName, password, router, setUser, enqueueSnackbar]);

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="username"
        label="User Name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        onClick={handleSignIn}
        disabled={loading} // ✅ disable while loading
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign in</Typography>
      </Box>
      {renderForm}
    </>
  );
}