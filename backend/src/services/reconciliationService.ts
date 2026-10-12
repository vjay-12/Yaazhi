import { prisma } from '../db.js';
import { LedgerService } from './ledgerService.js';

export interface ProductAuditReport {
  productId: string;
  sku: string;
  name: string;
  storedStock: number;
  ledgerDerivedBalance: number;
  difference: number;
  hasStoredVsLedgerDiscrepancy: boolean;
  hasBalanceAfterDiscrepancy: boolean;
  totalMovements: number;
  invalidBalanceAfterMovements: number;
  discrepancyDetails: string[];
  classification: 'MATCH' | 'BALANCE_AFTER_MISMATCH' | 'STOCK_LEDGER_MISMATCH' | 'CORRUPTED';
}

export interface AuditSummaryReport {
  totalProducts: number;
  matchedCount: number;
  discrepancyCount: number;
  products: ProductAuditReport[];
  discrepancies: ProductAuditReport[];
}

export class ReconciliationService {
  /**
   * Audits all products in the database.
   * Compares stored stock balances (physical inventory) with the stock movement ledger,
   * and verifies that running balance_after values are mathematically consistent.
   */
  static async auditAllProducts(): Promise<AuditSummaryReport> {
    const products = await prisma.product.findMany({
      include: {
        stock_balances: true,
        stock_movements: {
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
        },
      },
    });

    const reportProducts: ProductAuditReport[] = [];
    const discrepancies: ProductAuditReport[] = [];

    for (const p of products) {
      const storedStock = p.stock_balances.reduce(
        (sum, b) => sum + Number(b.current_quantity),
        0
      );

      let running = 0;
      let invalidBalanceAfterCount = 0;
      const details: string[] = [];

      // Check for duplicate initial opening stock seeds
      const initialStockMovements = p.stock_movements.filter(
        (m) => m.reference_type === 'INITIAL_STOCK'
      );
      if (initialStockMovements.length > 1) {
        details.push(
          `Product has ${initialStockMovements.length} initial stock movements (possible duplicate seed execution)`
        );
      }

      for (const m of p.stock_movements) {
        const qty = Number(m.quantity);
        running += qty;
        const recordedBalAfter = Number(m.balance_after);

        if (recordedBalAfter !== running) {
          invalidBalanceAfterCount++;
          details.push(
            `Movement ${m.id} (${m.movement_type}): recorded balance_after is ${recordedBalAfter}, but chronological running balance is ${running}`
          );
        }
      }

      const ledgerDerivedBalance = running;
      const difference = storedStock - ledgerDerivedBalance;
      const hasStoredVsLedgerDiscrepancy = difference !== 0;
      const hasBalanceAfterDiscrepancy = invalidBalanceAfterCount > 0;

      let classification: ProductAuditReport['classification'] = 'MATCH';
      if (hasStoredVsLedgerDiscrepancy) {
        classification = 'STOCK_LEDGER_MISMATCH';
      } else if (hasBalanceAfterDiscrepancy) {
        classification = 'BALANCE_AFTER_MISMATCH';
      }

      const reportItem: ProductAuditReport = {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        storedStock,
        ledgerDerivedBalance,
        difference,
        hasStoredVsLedgerDiscrepancy,
        hasBalanceAfterDiscrepancy,
        totalMovements: p.stock_movements.length,
        invalidBalanceAfterMovements: invalidBalanceAfterCount,
        discrepancyDetails: details,
        classification,
      };

      reportProducts.push(reportItem);
      if (hasStoredVsLedgerDiscrepancy || hasBalanceAfterDiscrepancy) {
        discrepancies.push(reportItem);
      }
    }

    return {
      totalProducts: products.length,
      matchedCount: products.length - discrepancies.length,
      discrepancyCount: discrepancies.length,
      products: reportProducts,
      discrepancies,
    };
  }

  /**
   * Safely reconciles historical ledger balance_after values for products.
   * Deterministically orders movements by [created_at ASC, id ASC] and sets
   * balance_after = running sum of quantities.
   * Does NOT alter physical stock or delete ledger entries.
   */
  static async reconcileLedgerBalances(productIds?: string[]): Promise<{
    reconciledCount: number;
    results: { productId: string; sku: string; updatedMovementsCount: number; finalBalance: number }[];
  }> {
    const whereClause = productIds && productIds.length > 0 ? { id: { in: productIds } } : {};
    const products = await prisma.product.findMany({
      where: whereClause,
      select: { id: true, sku: true },
    });

    const results = [];

    for (const p of products) {
      const res = await LedgerService.recalculateProductBalances(p.id);
      results.push({
        productId: p.id,
        sku: p.sku,
        updatedMovementsCount: res.movements.length,
        finalBalance: res.ledgerDerivedTotal,
      });
    }

    return {
      reconciledCount: results.length,
      results,
    };
  }
}
