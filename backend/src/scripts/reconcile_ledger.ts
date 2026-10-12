import dotenv from 'dotenv';
dotenv.config({ path: '.env.neon', override: true });
dotenv.config();

import { ReconciliationService } from '../services/reconciliationService.js';
import { prisma } from '../db.js';

async function main() {
  console.log('🔍 Yaazhi Stock Ledger Audit & Reconciliation Tool');
  console.log('=================================================');

  const report = await ReconciliationService.auditAllProducts();
  console.log(`\nAudit Summary:`);
  console.log(`- Total Catalog Products: ${report.totalProducts}`);
  console.log(`- Consistent Products: ${report.matchedCount}`);
  console.log(`- Products Requiring Review: ${report.discrepancyCount}`);

  if (report.discrepancies.length > 0) {
    console.log(`\nDiscrepancy Details:`);
    for (const d of report.discrepancies) {
      console.log(`\n• [${d.sku}] ${d.name}`);
      console.log(`  Stored Stock: ${d.storedStock} | Ledger Balance: ${d.ledgerDerivedBalance} | Diff: ${d.difference}`);
      console.log(`  Classification: ${d.classification}`);
      for (const det of d.discrepancyDetails) {
        console.log(`  - ${det}`);
      }
    }
  }

  // Safely reconcile running balances for products with balance_after mismatches
  const toReconcile = report.discrepancies
    .filter((d) => d.classification === 'BALANCE_AFTER_MISMATCH')
    .map((d) => d.productId);

  if (toReconcile.length > 0) {
    console.log(`\nReconciling chronological running balances for ${toReconcile.length} products...`);
    const res = await ReconciliationService.reconcileLedgerBalances(toReconcile);
    console.log(`Successfully reconciled ${res.reconciledCount} products.`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
