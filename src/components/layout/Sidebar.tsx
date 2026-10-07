import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Users,
  Package,
  ScrollText,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { YaazhiLogo } from '../icons/YaazhiLogo';

export type NavTabId =
  | 'overview'
  | 'billing'
  | 'orders'
  | 'customers'
  | 'products'
  | 'movements'
  | 'purchases'
  | 'vendors'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: NavTabId) => {
    onSelectTab(tab);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 95,
          }}
        />
      )}

      <aside
        className={`yz-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="yz-sidebar-brand">
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
              }}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <YaazhiLogo collapsed={true} size="sm" />
            </button>
          ) : (
            <>
              <div
                onClick={() => handleNavClick('overview')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Yaazhi Boutique"
              >
                <YaazhiLogo collapsed={false} size="md" />
              </div>

              {!isMobileOpen && (
                <button
                  onClick={onToggleCollapse}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--yz-border-sidebar)',
                    borderRadius: 'var(--yz-radius-sm)',
                    color: 'var(--yz-text-sidebar-muted)',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    boxSizing: 'border-box',
                  }}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={13} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation List */}
        <nav className="yz-sidebar-nav">
          {/* Overview */}
          <button
            className={`yz-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
            title="Overview"
          >
            <LayoutDashboard className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Overview</span>}
          </button>

          {/* SALES Section */}
          {!isCollapsed && <div className="yz-nav-group-title">Sales</div>}

          <button
            className={`yz-nav-item ${currentTab === 'billing' ? 'active' : ''}`}
            onClick={() => handleNavClick('billing')}
            title="Billing"
          >
            <Receipt className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Billing</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('orders')}
            title="Sales Orders"
          >
            <ShoppingBag className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Sales Orders</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'customers' ? 'active' : ''}`}
            onClick={() => handleNavClick('customers')}
            title="Customers"
          >
            <Users className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Customers</span>}
          </button>

          {/* INVENTORY Section */}
          {!isCollapsed && <div className="yz-nav-group-title">Inventory</div>}

          <button
            className={`yz-nav-item ${currentTab === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('products')}
            title="Products & Stock"
          >
            <Package className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Products & Stock</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'movements' ? 'active' : ''}`}
            onClick={() => handleNavClick('movements')}
            title="Stock Audit Log"
          >
            <ScrollText className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Stock Audit Log</span>}
          </button>

          {/* PURCHASING Section */}
          {!isCollapsed && <div className="yz-nav-group-title">Purchasing</div>}

          <button
            className={`yz-nav-item ${currentTab === 'purchases' ? 'active' : ''}`}
            onClick={() => handleNavClick('purchases')}
            title="Purchase Orders"
          >
            <ShoppingCart className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Purchase Orders</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'vendors' ? 'active' : ''}`}
            onClick={() => handleNavClick('vendors')}
            title="Vendors"
          >
            <Truck className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Vendors</span>}
          </button>

          {/* Reports */}
          <div style={{ margin: '4px 0' }} />

          <button
            className={`yz-nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
            title="Reports"
          >
            <BarChart3 className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Reports</span>}
          </button>

          {/* Settings */}
          <button
            className={`yz-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            title="Settings"
          >
            <Settings className="yz-nav-icon" size={15} />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="yz-sidebar-footer">
          <div className="yz-store-pill">
            <span className="yz-store-dot" />
            {!isCollapsed && <span>Showroom (Vellore) • Active</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

