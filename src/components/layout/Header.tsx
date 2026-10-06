import React from 'react';
import { Plus } from 'lucide-react';
import type { NavTabId } from './Sidebar';
import { Button } from '../common/Button';

interface HeaderProps {
  currentTab: NavTabId;
  onNewBillClick?: () => void;
  onNewProductClick: () => void;
}

const TAB_TITLES: Record<NavTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Boutique Overview',
    subtitle: 'Daily summary and showroom register health',
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
  onNewProductClick,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Yaazhi Boutique',
    subtitle: 'Inventory & POS Platform',
  };

  return (
    <header className="yz-header">
      <div className="yz-header-left">
        <div>
          <h1 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', lineHeight: 1.2 }}>
            {currentInfo.title}
          </h1>
          <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block', lineHeight: 1.2 }}>
            {currentInfo.subtitle}
          </span>
        </div>
      </div>

      <div className="yz-header-right">
        {/* Contextual primary action */}
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
