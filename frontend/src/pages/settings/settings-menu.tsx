import { useNavigate } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

export default function SettingsMenuPage() {
  const navigate = useNavigate();

  const menus = [
    { title: 'Sales Channels', path: 'channels', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
    { title: 'Sales Sections', path: 'sections', gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
    { title: 'Selling Prices', path: 'section-price', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { title: 'Categories', path: 'category', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
    { title: 'Stores', path: 'location', gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
    { title: 'Payment Modes', path: 'payment-modes', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { title: 'Purchased By', path: 'purchased-by', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  ];

  return (
    <Grid container spacing={3}>
      {menus.map((menu) => (
        <Grid size={{ xs:12, sm:6, md:2 }} key={menu.title}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              background: menu.gradient,
              color: 'white',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <CardActionArea onClick={() => navigate(menu.path)}>
              <CardContent sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" align="center">
                  {menu.title}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
