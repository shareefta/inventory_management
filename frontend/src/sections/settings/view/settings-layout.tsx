// src/sections/settings/settings-layout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { Box, Grid, List, ListItemButton, ListItemText, Typography } from '@mui/material';

export function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: 'Sales Channels', path: 'sales-channels' },
    { title: 'Sales Sections', path: 'sales-sections' },
  ];

  return (
    <Grid container spacing={3}>
      {/* Left menu column */}
      <Grid size={{ xs:12, md:9}} >
        <Box sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Settings
          </Typography>
          <List>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname.endsWith(item.path)}
                onClick={() => navigate(item.path)}
              >
                <ListItemText primary={item.title} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Grid>

      {/* Right content column */}
      <Grid size={{ xs:12, md:9}} >
        <Outlet />
      </Grid>
    </Grid>
  );
}
