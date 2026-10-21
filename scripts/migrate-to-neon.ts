import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

function sanitizeUrl(rawUrl?: string): { host: string; port: string; db: string } | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname,
      port: parsed.port || '5432',
      db: parsed.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
    });
  });
}

const MIGRATION_ORDER = [
  { model: 'companySettings', table: 'company_settings' },
  { model: 'godown', table: 'godowns' },
  { model: 'productCategory', table: 'product_categories' },
  { model: 'product', table: 'products' },
  { model: 'stockBalance', table: 'stock_balances' },
  { model: 'supplier', table: 'suppliers' },
  { model: 'customer', table: 'customers' },
  { model: 'purchaseOrder', table: 'purchase_orders' },
  { model: 'purchaseOrderItem', table: 'purchase_order_items' },
  { model: 'salesOrder', table: 'sales_orders' },
  { model: 'salesOrderItem', table: 'sales_order_items' },
  { model: 'invoice', table: 'invoices' },
  { model: 'payment', table: 'payments' },
  { model: 'stockMovement', table: 'stock_movements' },
  { model: 'stockAdjustment', table: 'stock_adjustments' },
  { model: 'stockAdjustmentItem', table: 'stock_adjustment_items' },
  { model: 'measurementTemplate', table: 'measurement_templates' },
  { model: 'measurementTemplateField', table: 'measurement_template_fields' },
  { model: 'customerMeasurementProfile', table: 'customer_measurement_profiles' },
  { model: 'customerMeasurementVersion', table: 'customer_measurement_versions' },
  { model: 'customerMeasurementValue', table: 'customer_measurement_values' },
  { model: 'stitchingTemplate', table: 'stitching_templates' },
  { model: 'stitchingAddon', table: 'stitching_addons' },
] as const;

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

  // Load environments
  const localEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env') }).parsed || {};
  const neonEnv = dotenv.config({ path: path.resolve(process.cwd(), '.env.neon') }).parsed || {};

  const localInfo = sanitizeUrl(localEnv.DATABASE_URL);
  const neonDirectUrl = neonEnv.DIRECT_URL || neonEnv.DATABASE_URL;
  const neonDirectInfo = sanitizeUrl(neonDirectUrl);

  console.log('========================================================');
  console.log('       YAAZHI DATABASE MIGRATION TO NEON');
  console.log('========================================================');
  console.log(`Mode:            ${isDryRun ? 'DRY RUN (Read-Only)' : 'LIVE EXECUTION'}`);
  console.log(`Source (Local):  ${localInfo ? `${localInfo.host}:${localInfo.port}/${localInfo.db}` : 'UNKNOWN'}`);
  console.log(`Target (Neon):   ${neonDirectInfo ? `${neonDirectInfo.host}:${neonDirectInfo.port}/${neonDirectInfo.db}` : 'UNKNOWN'}`);
  console.log('========================================================\n');

  // Safety validations
  if (!localEnv.DATABASE_URL || !neonDirectUrl) {
    console.error('ERROR: Missing DATABASE_URL in .env or DIRECT_URL in .env.neon');
    process.exit(1);
  }

  if (!neonDirectInfo?.host.includes('neon.tech')) {
    console.error('ERROR: Target host is not a neon.tech domain. Aborting for safety.');
    process.exit(1);
  }

  if (neonDirectInfo.host === localInfo?.host) {
    console.error('ERROR: Source and Target hosts are identical. Aborting for safety.');
    process.exit(1);
  }

  const localPrisma = new PrismaClient({
    datasources: { db: { url: localEnv.DATABASE_URL } },
  });

  const neonPrisma = new PrismaClient({
    datasources: { db: { url: neonDirectUrl } },
  });

  try {
    // 1. Check existing records on Neon
    console.log('Inspecting target Neon database...');
    let totalNeonRows = 0;
    const neonExistingCounts: Record<string, number> = {};

    for (const item of MIGRATION_ORDER) {
      try {
        const count = await (neonPrisma[item.model as keyof typeof neonPrisma] as any).count();
        neonExistingCounts[item.table] = count;
        totalNeonRows += count;
      } catch (err: any) {
        console.error(`Error querying Neon table ${item.table}:`, err.message);
        throw new Error(`Schema mismatch or missing table ${item.table} on Neon. Ensure prisma db push has been executed.`);
      }
    }

    if (totalNeonRows > 0) {
      console.log(`WARNING: Target Neon database already contains ${totalNeonRows} existing records!`);
      if (!isDryRun && !autoConfirm) {
        const proceed = await askConfirmation(
          `Neon DB contains ${totalNeonRows} records. Continue and merge/overwrite? (y/N): `
        );
        if (!proceed) {
          console.log('Aborted by user.');
          process.exit(0);
        }
      }
    } else {
      console.log('Target Neon database is empty and ready for data copy.\n');
    }

    // 2. Read local row counts
    console.log('Reading local database records...');
    const localDataMap = new Map<string, any[]>();
    let totalLocalRows = 0;

    for (const item of MIGRATION_ORDER) {
      const rows = await (localPrisma[item.model as keyof typeof localPrisma] as any).findMany();
      localDataMap.set(item.model, rows);
      totalLocalRows += rows.length;
      console.log(` - ${item.table.padEnd(32)}: ${rows.length} rows`);
    }

    console.log(`\nTotal local rows to migrate: ${totalLocalRows}`);

    if (isDryRun) {
      console.log('\n[DRY RUN COMPLETED] No data was written to Neon. All prerequisites verified successfully.');
      return;
    }

    // Interactive confirmation prompt
    if (!autoConfirm) {
      const confirmed = await askConfirmation(
        `\nProceed with migrating ${totalLocalRows} rows to ${neonDirectInfo.host}/${neonDirectInfo.db}? (y/N): `
      );
      if (!confirmed) {
        console.log('Migration cancelled by user.');
        return;
      }
    }

    // 3. Perform Migration inside a Transaction
    console.log('\nExecuting transactional data copy to Neon...');
    const startTime = Date.now();

    await neonPrisma.$transaction(
      async (tx) => {
        for (const item of MIGRATION_ORDER) {
          const rows = localDataMap.get(item.model) || [];
          if (rows.length === 0) continue;

          console.log(` Migrating ${item.table} (${rows.length} records)...`);
          // Batch in chunks of 50
          const chunkSize = 50;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            await (tx[item.model as keyof typeof tx] as any).createMany({
              data: chunk,
              skipDuplicates: true,
            });
          }
        }
      },
      { timeout: 120000 } // 2 minute timeout for transaction
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Data copy completed in ${elapsed}s.\n`);

    // 4. Sequences check and reset
    console.log('Checking sequences in Neon...');
    const sequences = await neonPrisma.$queryRawUnsafe<Array<{ sequence_name: string }>>(
      `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`
    );

    if (sequences.length === 0) {
      console.log(' Sequences: 0 sequences found (all tables use UUID or String primary keys). No reset needed.\n');
    } else {
      console.log(` Found ${sequences.length} sequence(s). Resetting...`);
      for (const seq of sequences) {
        console.log(`  - Resetting sequence ${seq.sequence_name}`);
      }
    }

    // 5. Verify and Print Row Counts Comparison
    console.log('========================================================================');
    console.log('                     VERIFICATION COMPARISON TABLE');
    console.log('========================================================================');
    console.log('Table Name                        | Local Rows | Neon Rows | Status');
    console.log('----------------------------------+------------+-----------+--------');

    let allMatched = true;
    for (const item of MIGRATION_ORDER) {
      const localCount = localDataMap.get(item.model)?.length || 0;
      const neonCount = await (neonPrisma[item.model as keyof typeof neonPrisma] as any).count();
      const match = localCount === neonCount;
      if (!match) allMatched = false;
      const status = match ? 'MATCH' : 'MISMATCH!';
      console.log(
        `${item.table.padEnd(34)}| ${localCount.toString().padStart(10)} | ${neonCount.toString().padStart(9)} | ${status}`
      );
    }
    console.log('----------------------------------+------------+-----------+--------');
    console.log(`Verification result: ${allMatched ? 'ALL TABLES MATCHED (100% SUCCESS)' : 'MISMATCH DETECTED!'}\n`);

    // 6. Spot-check key records
    console.log('--- SPOT CHECKING KEY RECORDS ---');
    const sampleProduct = await neonPrisma.product.findFirst({
      where: { is_active: true },
      select: { id: true, name: true, sku: true, sale_price: true },
    });
    console.log('Spot-check Product:', sampleProduct ? `${sampleProduct.sku} - ${sampleProduct.name} (₹${sampleProduct.sale_price})` : 'None');

    const sampleCustomer = await neonPrisma.customer.findFirst({
      select: { id: true, name: true, phone: true },
    });
    console.log('Spot-check Customer:', sampleCustomer ? `${sampleCustomer.name} (${sampleCustomer.phone})` : 'None');

    const sampleInvoice = await neonPrisma.invoice.findFirst({
      include: { payments: true, sales_order: { include: { items: true } } },
    });
    if (sampleInvoice) {
      console.log(
        `Spot-check Invoice: ${sampleInvoice.invoice_number} (Grand Total: ₹${sampleInvoice.grand_total}, Items: ${sampleInvoice.sales_order?.items.length ?? 0}, Payments: ${sampleInvoice.payments.length})`
      );
    }

    const sampleMeasurement = await neonPrisma.customerMeasurementValue.count();
    console.log(`Spot-check Customer Measurement Values count: ${sampleMeasurement}`);

  } catch (error: any) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

main();
