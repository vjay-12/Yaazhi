import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Scissors,
} from 'lucide-react';
import { YaazhiLogo } from '../icons/YaazhiLogo';

export type NavTabId =
  | 'overview'
  | 'billing'
  | 'products'
  | 'inventory'
  | 'movements'
  | 'orders'
  | 'purchases'
  | 'vendors'
  | 'customers'
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
            backgroundColor: 'rgba(23, 19, 18, 0.6)',
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
          <div
            onClick={() => handleNavClick('overview')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <YaazhiLogo collapsed={isCollapsed} size={isCollapsed ? 'sm' : 'md'} />
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
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="yz-sidebar-nav">
          {/* Main POS / Counter Action Highlight */}
          <button
            className={`yz-nav-item ${currentTab === 'billing' ? 'active' : ''}`}
            onClick={() => handleNavClick('billing')}
            style={{
              backgroundColor: currentTab === 'billing' ? 'var(--yz-primary)' : 'rgba(133, 34, 55, 0.18)',
              color: '#FFFFFF',
              borderColor: 'rgba(189, 141, 57, 0.4)',
              marginBottom: '0.5rem',
            }}
          >
            <Receipt className="yz-nav-icon" size={18} color="var(--yz-gold)" />
            {!isCollapsed && (
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                POS / Billing
                <span
                  style={{
                    fontSize: '0.625rem',
                    backgroundColor: 'var(--yz-gold)',
                    color: '#1C1817',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Fast
                </span>
              </span>
            )}
          </button>

          {!isCollapsed && <div className="yz-nav-group-title">Operations</div>}

          <button
            className={`yz-nav-item ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
          >
            <LayoutDashboard className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Overview</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleNavClick('orders')}
          >
            <ShoppingBag className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Sales Orders</span>}
          </button>

          {!isCollapsed && <div className="yz-nav-group-title">Catalog & Stock</div>}

          <button
            className={`yz-nav-item ${currentTab === 'products' ? 'active' : ''}`}
            onClick={() => handleNavClick('products')}
          >
            <Package className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Products Catalog</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'inventory' ? 'active' : ''}`}
            onClick={() => handleNavClick('inventory')}
          >
            <Layers className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Stock & Valuation</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'movements' ? 'active' : ''}`}
            onClick={() => handleNavClick('movements')}
          >
            <Scissors className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Stock Audit Log</span>}
          </button>

          {!isCollapsed && <div className="yz-nav-group-title">Commercial</div>}

          <button
            className={`yz-nav-item ${currentTab === 'purchases' ? 'active' : ''}`}
            onClick={() => handleNavClick('purchases')}
          >
            <ShoppingCart className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Purchases & POs</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'vendors' ? 'active' : ''}`}
            onClick={() => handleNavClick('vendors')}
          >
            <Truck className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Weavers & Vendors</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'customers' ? 'active' : ''}`}
            onClick={() => handleNavClick('customers')}
          >
            <Users className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Boutique Clients</span>}
          </button>

          {!isCollapsed && <div className="yz-nav-group-title">Administration</div>}

          <button
            className={`yz-nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
          >
            <BarChart3 className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Reports & GST</span>}
          </button>

          <button
            className={`yz-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <Settings className="yz-nav-icon" size={18} />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Sidebar Footer with Boutique Location Status */}
        <div className="yz-sidebar-footer">
          <div className="yz-store-pill">
            <span className="yz-store-dot" />
            {!isCollapsed && <span>Main Counter • Active</span>}
          </div>
        </div>
      </aside>
    </>
  );
};
