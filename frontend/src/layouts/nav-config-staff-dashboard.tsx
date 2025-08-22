import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type StaffNavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const StaffNavData = [
  {
    title: 'Dashboard',
    path: '/staff',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Products',
    path: '/staff/products',
    icon: icon('ic-cart'),
  },
  {
    title: 'Purchases',
    path: '/staff/purchase',
    icon: icon('ic-cart'),
  },
];
