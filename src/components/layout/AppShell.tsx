import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import type { NavTabId } from './Sidebar';
import { Header } from './Header';
import { QuickSearchModal } from './QuickSearchModal';
import { OverviewPage } from '../../features/overview/OverviewPage';
import { ProductsStockPage } from '../../features/products/ProductsStockPage';
import { ProductDetailPage } from '../../features/products/ProductDetailPage';
import { StockMovementsPage } from '../../features/inventory/StockMovementsPage';
import { BillingPage } from '../../features/billing/BillingPage';
import { SalesOrdersPage } from '../../features/commercial/SalesOrdersPage';
import { PurchasesPage } from '../../features/commercial/PurchasesPage';
import { VendorsPage } from '../../features/commercial/VendorsPage';
import { CustomersPage } from '../../features/commercial/CustomersPage';
import { ReportsPage } from '../../features/reports/ReportsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';
import type { YaazhiProduct, StockStatusFilter } from '../../types/product';
import { ProductModal } from '../../features/products/ProductModal';
import { productService } from '../../services/productService';
import { useToast } from '../common/Toast';

const TAB_PAGE_TITLES: Record<NavTabId, string> = {
  overview: 'Yaazhi | Boutique Overview',
  billing: 'Yaazhi | Billing',
  orders: 'Yaazhi | Sales Orders',
  customers: 'Yaazhi | Customers',
  products: 'Yaazhi | Products & Stock',
  movements: 'Yaazhi | Stock Audit Log',
  purchases: 'Yaazhi | Purchase Orders',
  vendors: 'Yaazhi | Vendors',
  reports: 'Yaazhi | Reports',
  settings: 'Yaazhi | Settings',
};

export const AppShell: React.FC = () => {
  const { showToast } = useToast();

  // Route / Tab State from URL hash
  const getInitialTab = (): NavTabId => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    if (hash === 'inventory') return 'products';
    if (hash === 'sales-orders' || hash === 'sales') return 'orders';
    if (hash === 'stock-audit' || hash === 'stock-movements' || hash === 'audit') return 'movements';
    if (hash === 'purchase-orders' || hash === 'purchase') return 'purchases';
    if (hash === 'suppliers') return 'vendors';
    const validTabs: NavTabId[] = [
      'overview',
      'billing',
      'orders',
      'customers',
      'products',
      'movements',
      'purchases',
      'vendors',
      'reports',
      'settings',
    ];
    return validTabs.includes(hash as NavTabId) ? (hash as NavTabId) : 'overview';
  };

  const [currentTab, setCurrentTab] = useState<NavTabId>(getInitialTab);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Layout states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('yaazhi_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Sync route and title
  useEffect(() => {
    window.location.hash = currentTab;
    if (selectedProductId && currentTab === 'products') {
      document.title = 'Yaazhi | Product Details';
    } else {
      document.title = TAB_PAGE_TITLES[currentTab] || 'Yaazhi Boutique';
    }
  }, [currentTab, selectedProductId]);

  // Listen to hash changes (browser forward/back or external navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getInitialTab();
      setCurrentTab(tab);
      setSelectedProductId(null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Keyboard Shortcuts (⌘K or ctrl+k for quick search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('yaazhi_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [initialProductStockFilter, setInitialProductStockFilter] = useState<StockStatusFilter | undefined>();

  const handleSelectTab = (tab: NavTabId, stockFilter?: StockStatusFilter) => {
    setCurrentTab(tab);
    setSelectedProductId(null);
    setInitialProductStockFilter(stockFilter);
  };

  const handleViewProductDetail = (product: YaazhiProduct) => {
    setCurrentTab('products');
    setSelectedProductId(product.id);
  };

  const handleCreateProductFromHeader = async (input: any) => {
    await productService.create(input);
    showToast({
      type: 'success',
      title: 'Product Created',
      message: `Added ${input.name} to catalog`,
    });
    setIsAddProductModalOpen(false);
    setCurrentTab('products');
  };

  return (
    <div className={`yz-app-layout ${isCollapsed ? 'yz-sidebar-collapsed' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main App Container */}
      <div className="yz-main-wrapper">
        <Header
          currentTab={currentTab}
          onNewBillClick={() => {
            setCurrentTab('billing');
            setSelectedProductId(null);
          }}
          onNewProductClick={() => setIsAddProductModalOpen(true)}
          onNewPurchaseOrderClick={() => handleSelectTab('purchases')}
        />

        {/* Content View */}
        <main className="yz-content-container">
          {currentTab === 'overview' && (
            <OverviewPage
              onNavigate={handleSelectTab}
              onViewProductDetail={handleViewProductDetail}
              onOpenAddProduct={() => setIsAddProductModalOpen(true)}
            />
          )}

          {currentTab === 'billing' && <BillingPage />}

          {currentTab === 'orders' && <SalesOrdersPage />}

          {currentTab === 'customers' && <CustomersPage />}

          {currentTab === 'products' && (
            <>
              {selectedProductId ? (
                <ProductDetailPage
                  productId={selectedProductId}
                  onBack={() => setSelectedProductId(null)}
                />
              ) : (
                <ProductsStockPage
                  onViewProductDetail={handleViewProductDetail}
                  onNavigateToAuditLog={() => setCurrentTab('movements')}
                  isAddModalOpenInitially={isAddProductModalOpen}
                  onCloseInitialAddModal={() => setIsAddProductModalOpen(false)}
                  initialStockFilter={initialProductStockFilter}
                />
              )}
            </>
          )}

          {currentTab === 'movements' && <StockMovementsPage />}

          {currentTab === 'purchases' && <PurchasesPage />}

          {currentTab === 'vendors' && <VendorsPage />}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectProduct={(product) => handleViewProductDetail(product)}
      />

      {/* Header Add Product Modal */}
      <ProductModal
        isOpen={isAddProductModalOpen && currentTab !== 'products'}
        onClose={() => setIsAddProductModalOpen(false)}
        onSubmit={handleCreateProductFromHeader}
      />
    </div>
  );
};
