import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { purchaseService, type PurchaseOrderData } from '../../services/purchaseService';
import { supplierService, type VendorData } from '../../services/supplierService';
import { productService } from '../../services/productService';
import type { YaazhiProduct } from '../../types/product';
import { useToast } from '../../components/common/Toast';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrderData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderData | null>(null);

  // Create PO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState('5');
  const [unitCost, setUnitCost] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receiving PO State
  const [isReceiving, setIsReceiving] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pos, vList, pList] = await Promise.all([
        purchaseService.list(),
        supplierService.list(),
        productService.list(),
      ]);
      setPurchases(pos);
      setVendors(vList);
      setProducts(pList);
      if (vList[0] && !selectedVendorId) setSelectedVendorId(vList[0].id);
      if (pList[0] && !selectedProductId) {
        setSelectedProductId(pList[0].id);
        setUnitCost(String(pList[0].costPrice));
      }
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load purchase orders' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendorId, selectedProductId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductSelectChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setUnitCost(String(prod.costPrice));
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !selectedProductId || Number(orderQty) <= 0) return;

    try {
      setIsSubmitting(true);
      const prod = products.find((p) => p.id === selectedProductId);
      const vendor = vendors.find((v) => v.id === selectedVendorId);

      await purchaseService.create({
        supplier_id: selectedVendorId,
        supplier_name: vendor?.name,
        notes: orderNotes.trim() || undefined,
        items: [
          {
            product_id: selectedProductId,
            quantity: Number(orderQty),
            unit_cost: Number(unitCost) || prod?.costPrice || 0,
            tax_rate: prod?.taxRate || 5.0,
          },
        ],
      });

      showToast({
        type: 'success',
        title: 'PO Created',
        message: `Generated purchase order for ${prod?.name}`,
      });

      setIsCreateModalOpen(false);
      setOrderNotes('');
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create purchase order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceivePO = async (po: PurchaseOrderData) => {
    if (po.status === 'RECEIVED') return;

    try {
      setIsReceiving(po.id);
      await purchaseService.receive(po.id, 'Counter receipt verified');
      showToast({
        type: 'success',
        title: 'Goods Received',
        message: `PO ${po.poNumber} stock received into inventory successfully`,
      });
      loadData();
      if (selectedPO?.id === po.id) {
        setSelectedPO({ ...selectedPO, status: 'RECEIVED' });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Receive Failed',
        message: err.message || 'Could not receive goods',
      });
    } finally {
      setIsReceiving(null);
    }
  };

  const filtered = purchases.filter(
    (p) =>
      p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      p.itemsSummary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--yz-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search PO #, weaver, or line items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '26px' }}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Purchase Order
        </Button>
      </div>

      {/* Clean Compact Single-Line Purchases Table */}
      <div className="yz-table-container">
        <table className="yz-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>PO Number</th>
              <th>Weaver / Vendor</th>
              <th style={{ width: '100px' }}>Order Date</th>
              <th>Items & Weaves</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Units</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Total Cost</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading purchase orders from database...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                  No purchase orders found matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPO(p)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view purchase order lines"
                >
                  <td style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                    {p.poNumber}
                  </td>
                  <td>
                    <div className="yz-cell-truncate" style={{ maxWidth: '180px' }}>
                      {p.vendorName}
                    </div>
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                    {p.date}
                  </td>
                  <td>
                    <div className="yz-cell-truncate" style={{ maxWidth: '240px' }} title={p.itemsSummary}>
                      {p.itemsSummary}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                    {p.itemsCount}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      fontFamily: 'var(--yz-font-mono)',
                    }}
                  >
                    ₹{p.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--yz-radius-sm)',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        backgroundColor:
                          p.status === 'RECEIVED'
                            ? '#DCFCE7'
                            : p.status === 'ORDERED'
                            ? '#FEF3C7'
                            : 'var(--yz-bg-subtle)',
                        color:
                          p.status === 'RECEIVED'
                            ? '#166534'
                            : p.status === 'ORDERED'
                            ? '#92400E'
                            : 'var(--yz-text-muted)',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {p.status === 'ORDERED' && (
                        <button
                          className="yz-btn yz-btn-primary yz-btn-sm"
                          style={{ padding: '2px 6px', height: '22px', fontSize: '10.5px', backgroundColor: '#166534' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReceivePO(p);
                          }}
                          disabled={isReceiving === p.id}
                          title="Receive goods into inventory"
                        >
                          {isReceiving === p.id ? '...' : 'Receive'}
                        </button>
                      )}
                      <button
                        className="yz-btn yz-btn-secondary yz-btn-sm"
                        style={{ padding: '2px 5px', height: '22px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPO(p);
                        }}
                        title="View PO Details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase Order Details Modal */}
      {selectedPO && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order: ${selectedPO.poNumber}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '8px 10px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>WEAVER / VENDOR</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedPO.vendorName}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>ORDER DATE</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedPO.date}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>STATUS</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedPO.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>TOTAL VALUE</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-primary)' }}>
                  ₹{selectedPO.totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 600 }}>Itemized Procurement Lines</div>
            <div className="yz-table-container">
              <table className="yz-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '90px' }}>SKU</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.productName}</td>
                      <td style={{ fontFamily: 'var(--yz-font-mono)' }}>{it.sku}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{it.unitCost.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ₹{(it.total || it.quantity * it.unitCost).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedPO.notes && (
              <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>
                Procurement Notes: {selectedPO.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              {selectedPO.status === 'ORDERED' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 size={13} />}
                  onClick={() => handleReceivePO(selectedPO)}
                  disabled={isReceiving === selectedPO.id}
                >
                  {isReceiving === selectedPO.id ? 'Receiving...' : 'Receive into Stock'}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedPO(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Purchase Order Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Create New Purchase Order"
          size="md"
        >
          <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="yz-label">Select Weaver / Vendor *</label>
                <CustomDropdown
                  value={selectedVendorId}
                  onChange={(val) => setSelectedVendorId(String(val))}
                  options={vendors.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.city})`,
                  }))}
                  minWidth="100%"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="yz-label">Select Product / Weave *</label>
                <CustomDropdown
                  value={selectedProductId}
                  onChange={(val) => handleProductSelectChange(String(val))}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.name} (${p.sku})`,
                  }))}
                  minWidth="100%"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="yz-label">Order Quantity (Units) *</label>
                <input
                  type="number"
                  min="1"
                  className="yz-input"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="yz-label">Negotiated Unit Cost (₹) *</label>
                <input
                  type="number"
                  min="0"
                  className="yz-input"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="yz-label">Procurement & Loom Notes</label>
              <textarea
                className="yz-input"
                rows={2}
                placeholder="e.g. Traditional loom order, certified silver zari lot"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                style={{ height: 'auto', padding: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
