import React from 'react';
import { Plus, Receipt, ShoppingBag } from 'lucide-react';
import type { NavTabId } from './Sidebar';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  currentTab: NavTabId;
  onNewBillClick?: () => void;
  onNewProductClick: () => void;
  onNewPurchaseOrderClick?: () => void;
}

const TAB_TITLES: Record<NavTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'Your boutique sales, inventory, and daily activity at a glance.',
  },
  billing: {
    title: 'Billing',
    subtitle: 'Counter sales, barcode scanning, and instant invoices',
  },
  orders: {
    title: 'Sales Orders',
    subtitle: 'Bridal client reservations and deliveries',
  },
  customers: {
    title: 'Customers',
    subtitle: 'Client profiles, loyalty, and tailoring measurements',
  },
  products: {
    title: 'Products & Stock',
    subtitle: 'Boutique catalog, physical stock, and valuation',
  },
  movements: {
    title: 'Stock Audit Log',
    subtitle: 'Immutable record of adjustments, receipts, and counter sales',
  },
  purchases: {
    title: 'Purchase Orders',
    subtitle: 'Procurement from weaver cooperatives and textile mills',
  },
  vendors: {
    title: 'Vendors',
    subtitle: 'Master weavers, cooperative societies, and suppliers',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Sales analytics, weave velocity, and GST breakdowns',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Store profile, GSTIN, invoice prefix, and test data',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNewBillClick,
  onNewProductClick,
  onNewPurchaseOrderClick,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Yaazhi Boutique',
    subtitle: 'Inventory & POS Platform',
  };

  return (
    <header className="yz-header">
      <div className="yz-header-left">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 800,
              color: 'var(--yz-text-primary)',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {currentInfo.title}
          </h1>
          <span
            className="yz-header-subtitle"
            style={{
              fontSize: '11.5px',
              color: 'var(--yz-text-muted)',
              display: 'block',
              lineHeight: 1.35,
              marginTop: '1px',
              fontWeight: 500,
            }}
          >
            {currentInfo.subtitle}
          </span>
        </div>
      </div>

      <div className="yz-header-right">
        {/* Global Consistent Theme Toggle */}
        <ThemeToggle />

        {/* Contextual primary actions */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Button
              variant="primary"
              icon={<Receipt size={13} />}
              onClick={onNewBillClick}
              size="sm"
            >
              New Bill
            </Button>
            <Button
              variant="secondary"
              icon={<Plus size={13} />}
              onClick={onNewProductClick}
              size="sm"
              className="yz-header-action-secondary"
            >
              Add Product
            </Button>
            <Button
              variant="secondary"
              icon={<ShoppingBag size={13} />}
              onClick={onNewPurchaseOrderClick}
              size="sm"
              className="yz-header-action-secondary"
            >
              Create Purchase Order
            </Button>
          </div>
        )}

        {currentTab === 'products' && (
          <Button
            variant="primary"
            icon={<Plus size={13} />}
            onClick={onNewProductClick}
            size="sm"
          >
            Add Product
          </Button>
        )}
      </div>
    </header>
  );
};

