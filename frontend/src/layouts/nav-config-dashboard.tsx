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
    title: 'Product',
    path: '/products',
    icon: icon('ic-cart'),
  },
  {
    title: 'Purchase',
    path: '/purchase',
    icon: icon('ic-cart'),
  },
  {
    title: 'Category',
    path: '/category',
    icon: icon('ic-category'),
  },
  {
    title: 'Location',
    path: '/location',
    icon: icon('ic-location'),
  },
  // {
  //   title: 'Purchases',
  //   path: '/purchases',
  //   icon: icon('ic-purchase'),
  // },
  // {
  //   title: 'Sales',
  //   path: '/sales',
  //   icon: icon('ic-sales'),
  // },
  // {
  //   title: 'Orders',
  //   path: '/orders',
  //   icon: icon('ic-order'),
  // },
  // {
  //   title: 'Delivery',
  //   path: '/delivery',
  //   icon: icon('ic-delivery'),
  // },  
  {
    title: 'Users',
    path: '/user',
    icon: icon('ic-user'),
  },
];
