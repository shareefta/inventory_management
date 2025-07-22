// src/layouts/staff-dashboard-layout.tsx

import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemText,
} from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import { Link as RouterLink } from 'react-router-dom';

const drawerWidth = 100;

type StaffDashboardLayoutProps = {
  children?: ReactNode;
};

export function StaffDashboardLayout({ children }: StaffDashboardLayoutProps) {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h4" noWrap component="div">
            Staff Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItemButton component={RouterLink} to="products">
            <ListItemText primary="Products" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <Toolbar />
        {children ?? <Outlet />}
      </Box>
    </Box>
  );
}