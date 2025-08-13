import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import StoreIcon from '@mui/icons-material/Store';
import CardContent from '@mui/material/CardContent';
import CategoryIcon from '@mui/icons-material/Category';
import CardActionArea from '@mui/material/CardActionArea';

export default function SettingsMenuPage() {
  const navigate = useNavigate();

  const menus = [
    {
      title: 'Sales Channels',
      path: 'channels',
      illustration: (
        <img
          src="https://cdn-icons-png.flaticon.com/512/3022/3022821.png"
          alt="Sales Channels"
          width={70}
          height={70}
        />
      ),
      gradient: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
    },
    {
      title: 'Sales Sections',
      path: 'sections',
      illustration: (
        <img
          src="https://cdn-icons-png.flaticon.com/512/2950/2950651.png"
          alt="Sales Sections"
          width={70}
          height={70}
        />
      ),
      gradient: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {menus.map((menu) => (
        <Grid size={{ xs:12, sm:6, md:3 }} key={menu.title}>
          <Card
            sx={{
              borderRadius: 3,
              background: menu.gradient,
              backgroundSize: '200% 200%',
              animation: 'gradientShift 8s ease infinite',
              color: '#fff',
              boxShadow: 4,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: 8,
                animation: 'gradientShift 3s ease infinite',
              },
              '@keyframes gradientShift': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
            }}
          >
            <CardActionArea onClick={() => navigate(menu.path)}>
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 5,
                }}
              >
                <Box sx={{ mb: 2 }}>{menu.illustration}</Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {menu.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  Manage {menu.title}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
