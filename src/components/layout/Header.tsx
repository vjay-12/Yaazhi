import React from 'react';
import { Menu, Search, Plus, MapPin, Receipt } from 'lucide-react';
import type { NavTabId } from './Sidebar';
import { Button } from '../common/Button';

interface HeaderProps {
  currentTab: NavTabId;
  onOpenMobileSidebar: () => void;
  onOpenQuickSearch: () => void;
  onNewBillClick: () => void;
  onNewProductClick: () => void;
}

const TAB_TITLES: Record<NavTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'Boutique Overview',
    subtitle: 'Daily operational summary and inventory health',
  },
  billing: {
    title: 'Point of Sale & Billing',
    subtitle: 'Fast counter sales, barcode scanning, and invoice generation',
  },
  products: {
    title: 'Product Catalog',
    subtitle: 'Manage boutique weaves, silks, garments, prices, and GST rates',
  },
  inventory: {
    title: 'Stock & Inventory Valuation',
    subtitle: 'Live stock balances across showroom and storage counters',
  },
  movements: {
    title: 'Stock Movements & Audit Ledger',
    subtitle: 'Immutable record of inventory adjustments, receipts, and sales',
  },
  orders: {
    title: 'Sales Orders',
    subtitle: 'Client bridal reservations, custom tailoring, and deliveries',
  },
  purchases: {
    title: 'Purchase Orders',
    subtitle: 'Procurement from weaver cooperatives and textile mills',
  },
  vendors: {
    title: 'Master Weavers & Suppliers',
    subtitle: 'Vendor directory, GSTINs, and purchase histories',
  },
  customers: {
    title: 'Boutique Clients & Measurements',
    subtitle: 'Customer profiles, purchase loyalty, and custom tailoring specs',
  },
  reports: {
    title: 'Boutique Analytics & GST Reports',
    subtitle: 'Revenue, stock velocity, and tax breakdowns',
  },
  settings: {
    title: 'Boutique Configuration',
    subtitle: 'Store profile, GSTIN, invoice series, and user roles',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenQuickSearch,
  onNewBillClick,
  onNewProductClick,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Yaazhi Boutique',
    subtitle: 'Inventory & POS Platform',
  };

  return (
    <header className="yz-header">
      <div className="yz-header-left">
        <button
          onClick={onOpenMobileSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--yz-text-primary)',
          }}
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
            {currentInfo.title}
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--yz-text-secondary)', display: 'block' }}>
            {currentInfo.subtitle}
          </span>
        </div>
      </div>

      <div className="yz-header-right">
        {/* Quick Search trigger */}
        <button
          className="yz-quick-search-btn"
          onClick={onOpenQuickSearch}
          title="Search products by SKU, name, or barcode"
        >
          <Search size={15} />
          <span>Search products, SKUs...</span>
          <kbd className="yz-kbd">⌘K</kbd>
        </button>

        {/* Counter Location Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--yz-text-secondary)',
          }}
          title="Active Showroom Counter Location"
        >
          <MapPin size={13} color="var(--yz-primary)" />
          <span>Main Showroom (SR-01)</span>
        </div>

        {/* Contextual primary action */}
        {currentTab === 'products' ? (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={onNewProductClick}
            size="sm"
          >
            Add Product
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={<Receipt size={16} />}
            onClick={onNewBillClick}
            size="sm"
          >
            New Bill
          </Button>
        )}
      </div>
    </header>
  );
};
