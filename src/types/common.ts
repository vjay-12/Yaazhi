export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

export type AppRoute =
  | '/'
  | '/products'
  | '/products/new'
  | '/products/:id'
  | '/inventory'
  | '/inventory/movements'
  | '/billing'
  | '/orders'
  | '/purchases'
  | '/customers'
  | '/vendors'
  | '/reports'
  | '/settings';

export interface NavItem {
  id: string;
  label: string;
  path: AppRoute;
  iconName: string;
  badgeCount?: number;
  group?: 'core' | 'catalog' | 'commercial' | 'insights';
}
