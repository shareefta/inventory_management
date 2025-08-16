import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title: string;
  total_products: number;
  total_stock: number;
  stock_value: number;
  color?: PaletteColorKey;
  icon?: React.ReactNode; // keep the icon prop for compatibility
};

export function ProductSummaryCard({
  sx,
  title,
  total_products,
  total_stock,
  stock_value,
  color = 'primary',
  icon, // accept icon but do not render
  ...other
}: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={[
        () => ({
          p: 3,
          boxShadow: 'none',
          position: 'relative',
          height: 185, // fixed height to match other cards
          color: `${color}.darker`,
          backgroundColor: 'common.white',
          backgroundImage: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].lighterChannel, 0.48)}, ${varAlpha(theme.vars.palette[color].lightChannel, 0.48)})`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* SVG at top-left */}
      <SvgColor
        src="/assets/icons/glass/ic-glass-buy.svg"
        sx={{
          top: 20,
          left: 0,
          width: 100,
          height: 50,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />

      {/* Top-right Stock value */}
      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Box sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
          Stock Value:
        </Box>
        <Box sx={{ typography: 'h4', fontWeight: 700, color: 'primary.main' }}>
          QR {stock_value.toLocaleString()}
        </Box>
      </Box>

      <br/>
      {/* Bottom metrics */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: '100%',
          pt: 4,
        }}
      >
        {/* Bottom-left: total products */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Box sx={{ typography: 'subtitle2', mb: 0.5 }}>Total Products</Box>
          <Box sx={{ typography: 'h6', fontWeight: 700 }}>{total_products}</Box>
        </Box>

        {/* Bottom-right: total stock */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Box sx={{ typography: 'subtitle2', mb: 0.5 }}>Total Stock</Box>
          <Box sx={{ typography: 'h6', fontWeight: 700 }}>{total_stock}</Box>
        </Box>
      </Box>
    </Card>
  );
}
