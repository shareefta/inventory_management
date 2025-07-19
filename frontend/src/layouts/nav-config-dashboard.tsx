import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Product',
    path: '/products',
    icon: icon('ic-cart'),
  },
  {
    title: 'Purchases',
    path: '/purchases',
    icon: icon('ic-purchase'),
  },
  {
    title: 'Sales',
    path: '/sales',
    icon: icon('ic-sales'),
  },
  {
    title: 'Orders',
    path: '/orders',
    icon: icon('ic-order'),
  },
  {
    title: 'Delivery Partners',
    path: '/user',
    icon: icon('ic-delivery'),
  },
];
