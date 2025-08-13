// src/sections/settings/view/settings-view.tsx
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const settingsMenus = [
  { title: 'Sales Channels', path: 'channels' },
  { title: 'Sales Sections', path: 'sections' },
];

export function SettingsView() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', gap: 4, p: 3 }}>
      {/* Left Menu */}
      <Box sx={{ minWidth: 200 }}>
        <Typography variant="h6" gutterBottom>
          Settings
        </Typography>
        <Stack spacing={2}>
          {settingsMenus.map((menu) => (
            <Button
              key={menu.path}
              variant={location.pathname.endsWith(menu.path) ? 'contained' : 'outlined'}
              fullWidth
              onClick={() => navigate(menu.path)}
            >
              {menu.title}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Content area */}
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
