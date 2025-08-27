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

export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'Products',
    path: '/products',
    icon: icon('ic-product'),
  },
  {
    title: 'Purchases',
    path: '/purchase',
    icon: icon('ic-cart'),
  },
  {
    title: 'Sales',
    path: '/sales',
    icon: icon('ic-sales'),
  },
  {
    title: 'Users',
    path: '/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: icon('ic-settings'),
  },
];
