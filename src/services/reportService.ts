import { api } from './apiClient';

export interface ReportDashboardData {
  summary: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalVendors: number;
    totalStockUnits: number;
    valuationCost: number;
    valuationRetail: number;
    totalSalesRevenue: number;
    totalPurchasesSpend: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  topProducts: {
    name: string;
    sku: string;
    units: number;
    revenue: number;
  }[];
  recentMovements: {
    id: string;
    type: string;
    productName: string;
    sku: string;
    godownName: string;
    quantity: number;
    balanceAfter: number;
    createdAt: string;
    notes?: string;
  }[];
}

class ReportService {
  public async getDashboard(): Promise<ReportDashboardData> {
    return api.get<ReportDashboardData>('/reports/dashboard');
  }
}

export const reportService = new ReportService();
