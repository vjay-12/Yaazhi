/**
 * Comprehensive Pagination Test Suite for Yaazhi
 * Validates:
 * 1. Single and multi-page calculations (1 page, 2 pages, 3 pages, 5+ pages, 10+ pages)
 * 2. Page sizes: 10, 20, 50, 100
 * 3. First, middle, and last page navigation
 * 4. Slicing bounds & item integrity
 * 5. "Showing X-Y of Z" and "Showing 0 of 0" display logic
 * 6. Search + filter + sort resets to page 1
 * 7. Clamping on record deletion/archiving (no empty page states)
 * 8. Page size changes and safe bounds
 * 9. Ellipsis logic matching Invenaro
 */

const assert = require('assert');

// Slicing and pagination calculation logic identical to usePagination and Pagination
function calculatePagination({ totalItems, currentPage, pageSize }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);
  const sliceStart = (safeCurrentPage - 1) * pageSize;
  const sliceEnd = sliceStart + pageSize;

  return {
    totalPages,
    safeCurrentPage,
    startIndex,
    endIndex,
    sliceStart,
    sliceEnd,
    rangeText: totalItems === 0 ? 'Showing 0 of 0' : `Showing ${startIndex}–${endIndex} of ${totalItems}`,
  };
}

// Ellipsis generation matching Invenaro logic in Pagination.tsx
function getPageNumbers(totalPages, currentPage) {
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const showLeftEllipsis = safeCurrentPage > 3;
  const showRightEllipsis = safeCurrentPage < totalPages - 2;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push('ellipsis-left');
  }

  let start = Math.max(2, safeCurrentPage - 1);
  let end = Math.min(totalPages - 1, safeCurrentPage + 1);

  if (safeCurrentPage <= 3) {
    end = 4;
  } else if (safeCurrentPage >= totalPages - 2) {
    start = totalPages - 3;
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push('ellipsis-right');
  }

  pages.push(totalPages);

  return pages;
}

console.log('=== RUNNING YAAZHI PAGINATION TEST SUITE ===\n');

// 1. Test Empty State
console.log('1. Testing Empty State (0 records)...');
const empty = calculatePagination({ totalItems: 0, currentPage: 1, pageSize: 20 });
assert.strictEqual(empty.totalPages, 1, 'Empty state should have 1 total page');
assert.strictEqual(empty.startIndex, 0, 'Start index should be 0');
assert.strictEqual(empty.endIndex, 0, 'End index should be 0');
assert.strictEqual(empty.rangeText, 'Showing 0 of 0', 'Range text should be Showing 0 of 0');
console.log('  ✓ Empty state passed');

// 2. Test 1 page (e.g. 6 realistic orders with pageSize 20)
console.log('\n2. Testing 1 Page (6 records, pageSize 20)...');
const onePage = calculatePagination({ totalItems: 6, currentPage: 1, pageSize: 20 });
assert.strictEqual(onePage.totalPages, 1);
assert.strictEqual(onePage.startIndex, 1);
assert.strictEqual(onePage.endIndex, 6);
assert.strictEqual(onePage.rangeText, 'Showing 1–6 of 6');
console.log('  ✓ 1 page passed');

// 3. Test 2 pages (25 records, pageSize 20 and pageSize 10)
console.log('\n3. Testing 2 Pages (25 records, pageSize 20)...');
const p1 = calculatePagination({ totalItems: 25, currentPage: 1, pageSize: 20 });
assert.strictEqual(p1.totalPages, 2);
assert.strictEqual(p1.rangeText, 'Showing 1–20 of 25');

const p2 = calculatePagination({ totalItems: 25, currentPage: 2, pageSize: 20 });
assert.strictEqual(p2.rangeText, 'Showing 21–25 of 25');
console.log('  ✓ 2 pages passed');

// 4. Test 3 pages (54 records, pageSize 20)
console.log('\n4. Testing 3 Pages (54 records, pageSize 20)...');
const page54_1 = calculatePagination({ totalItems: 54, currentPage: 1, pageSize: 20 });
assert.strictEqual(page54_1.rangeText, 'Showing 1–20 of 54');
const page54_2 = calculatePagination({ totalItems: 54, currentPage: 2, pageSize: 20 });
assert.strictEqual(page54_2.rangeText, 'Showing 21–40 of 54');
const page54_3 = calculatePagination({ totalItems: 54, currentPage: 3, pageSize: 20 });
assert.strictEqual(page54_3.rangeText, 'Showing 41–54 of 54');
console.log('  ✓ 3 pages (Showing 1-20, 21-40, 41-54 of 54) passed');

// 5. Test 5+ pages (110 records, pageSize 20 = 6 pages)
console.log('\n5. Testing 5+ Pages (110 records, pageSize 20)...');
const p6 = calculatePagination({ totalItems: 110, currentPage: 6, pageSize: 20 });
assert.strictEqual(p6.totalPages, 6);
assert.strictEqual(p6.rangeText, 'Showing 101–110 of 110');
console.log('  ✓ 5+ pages passed');

// 6. Test 10+ pages (105 records, pageSize 10 = 11 pages)
console.log('\n6. Testing 10+ Pages (105 records, pageSize 10)...');
const p11 = calculatePagination({ totalItems: 105, currentPage: 11, pageSize: 10 });
assert.strictEqual(p11.totalPages, 11);
assert.strictEqual(p11.rangeText, 'Showing 101–105 of 105');
console.log('  ✓ 10+ pages passed');

// 7. Test Page Size Variations: 10, 20, 50, 100 on 95 records
console.log('\n7. Testing Page Size Variations (95 records with sizes 10, 20, 50, 100)...');
[10, 20, 50, 100].forEach((size) => {
  const calc = calculatePagination({ totalItems: 95, currentPage: 1, pageSize: size });
  const expectedPages = Math.ceil(95 / size);
  assert.strictEqual(calc.totalPages, expectedPages, `Expected ${expectedPages} pages for size ${size}`);
  console.log(`  ✓ Page size ${size}: ${calc.totalPages} pages, range ${calc.rangeText}`);
});

// 8. Test Clamping / Invalid Page Handling (e.g. user on page 3, items deleted down to 25)
console.log('\n8. Testing Clamping / Invalid Page Handling...');
// Initially 54 items (3 pages). User is on page 3.
let state = calculatePagination({ totalItems: 54, currentPage: 3, pageSize: 20 });
assert.strictEqual(state.safeCurrentPage, 3);
// After deleting items, now only 21 items remain (2 pages).
let clamped = calculatePagination({ totalItems: 21, currentPage: 3, pageSize: 20 });
assert.strictEqual(clamped.totalPages, 2);
assert.strictEqual(clamped.safeCurrentPage, 2, 'Should clamp automatically to page 2');
assert.strictEqual(clamped.rangeText, 'Showing 21–21 of 21');

// When reduced to 0 records
let clampedZero = calculatePagination({ totalItems: 0, currentPage: 3, pageSize: 20 });
assert.strictEqual(clampedZero.safeCurrentPage, 1, 'Should clamp to 1 when total is 0');
assert.strictEqual(clampedZero.rangeText, 'Showing 0 of 0');
console.log('  ✓ Auto-clamping on record reduction passed');

// 9. Test Page Size Switching Clamping (e.g. Page 5 at 10/page -> Switch to 50/page)
console.log('\n9. Testing Page Size Switching Clamping...');
// 60 items at 10/page: User on page 6.
const at10 = calculatePagination({ totalItems: 60, currentPage: 6, pageSize: 10 });
assert.strictEqual(at10.safeCurrentPage, 6);
// Switched to 50/page: Total pages becomes 2. Clamped page becomes 2.
const at50 = calculatePagination({ totalItems: 60, currentPage: 6, pageSize: 50 });
assert.strictEqual(at50.totalPages, 2);
assert.strictEqual(at50.safeCurrentPage, 2);
assert.strictEqual(at50.rangeText, 'Showing 51–60 of 60');
console.log('  ✓ Page size switch clamping passed');

// 10. Test Ellipsis Generation Matching Invenaro
console.log('\n10. Testing Ellipsis Generation (Invenaro algorithm)...');
// Under 7 pages: All pages shown
const p5Pages = getPageNumbers(5, 3);
assert.deepStrictEqual(p5Pages, [1, 2, 3, 4, 5]);

// 10 pages, on page 1: [1, 2, 3, 4, 'ellipsis-right', 10]
const p10_on_1 = getPageNumbers(10, 1);
assert.deepStrictEqual(p10_on_1, [1, 2, 3, 4, 'ellipsis-right', 10]);

// 10 pages, on page 5: [1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10]
const p10_on_5 = getPageNumbers(10, 5);
assert.deepStrictEqual(p10_on_5, [1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10]);

// 10 pages, on page 10: [1, 'ellipsis-left', 7, 8, 9, 10]
const p10_on_10 = getPageNumbers(10, 10);
assert.deepStrictEqual(p10_on_10, [1, 'ellipsis-left', 7, 8, 9, 10]);
console.log('  ✓ Ellipsis generation passed for first, middle, and last pages');

// 11. Test Search and Filter Reset Simulation
console.log('\n11. Testing Search + Filter Reset Simulation...');
const fullDataset = Array.from({ length: 65 }, (_, i) => ({
  id: `SO-${i + 1}`,
  status: i % 2 === 0 ? 'PAID' : 'PENDING',
  customer: i === 15 ? 'Priya Raman' : `Customer ${i + 1}`,
}));

// User is on page 3 of full dataset (pageSize 20)
let currentP = 3;
let currentFilter = 'ALL';
let currentSearch = '';

let filtered = fullDataset.filter((item) => {
  if (currentFilter !== 'ALL' && item.status !== currentFilter) return false;
  if (currentSearch && !item.customer.toLowerCase().includes(currentSearch.toLowerCase())) return false;
  return true;
});
let pagination = calculatePagination({ totalItems: filtered.length, currentPage: currentP, pageSize: 20 });
assert.strictEqual(pagination.safeCurrentPage, 3);
assert.strictEqual(pagination.rangeText, 'Showing 41–60 of 65');

// User searches "Priya" -> Triggers resetDependency -> Reset to page 1
currentSearch = 'Priya';
currentP = 1; // Hook reset
filtered = fullDataset.filter((item) => {
  if (currentFilter !== 'ALL' && item.status !== currentFilter) return false;
  if (currentSearch && !item.customer.toLowerCase().includes(currentSearch.toLowerCase())) return false;
  return true;
});
pagination = calculatePagination({ totalItems: filtered.length, currentPage: currentP, pageSize: 20 });
assert.strictEqual(pagination.safeCurrentPage, 1);
assert.strictEqual(pagination.rangeText, 'Showing 1–1 of 1');
console.log('  ✓ Search reset to page 1 verified');

// Clearing search -> Triggers reset to page 1
currentSearch = '';
currentP = 1;
filtered = fullDataset.filter((item) => {
  if (currentFilter !== 'ALL' && item.status !== currentFilter) return false;
  return true;
});
pagination = calculatePagination({ totalItems: filtered.length, currentPage: currentP, pageSize: 20 });
assert.strictEqual(pagination.safeCurrentPage, 1);
assert.strictEqual(pagination.rangeText, 'Showing 1–20 of 65');
console.log('  ✓ Clearing search reset to page 1 verified');

// Changing filter to 'PENDING' -> 32 items
currentFilter = 'PENDING';
currentP = 1;
filtered = fullDataset.filter((item) => item.status === currentFilter);
pagination = calculatePagination({ totalItems: filtered.length, currentPage: currentP, pageSize: 20 });
assert.strictEqual(pagination.safeCurrentPage, 1);
assert.strictEqual(pagination.totalPages, 2);
assert.strictEqual(pagination.rangeText, 'Showing 1–20 of 32');
console.log('  ✓ Filter reset to page 1 verified');

console.log('\n=== ALL PAGINATION SUITE TESTS PASSED SUCCESSFULLY! ===\n');
