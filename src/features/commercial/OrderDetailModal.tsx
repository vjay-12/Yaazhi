import React, { useState } from 'react';
import { Ban, Scissors, Printer } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type { SalesOrderData } from '../../services/salesOrderService';
import { PrintTailorSheetModal } from './PrintTailorSheetModal';

interface OrderDetailModalProps {
  order: SalesOrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadInvoice?: (order: SalesOrderData) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [measurementForPrint, setMeasurementForPrint] = useState<any | null>(null);

  if (!order || !isOpen) return null;

  const formatDisplayDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const isVoided = order.status === 'VOIDED' || order.status === 'CANCELLED' || order.paymentStatus === 'VOIDED';
  const isPaid = !isVoided && (order.paymentStatus === 'PAID' || (order.totalAmount > 0 && order.pendingAmount === 0));

  let statusLabel = 'PENDING';
  let statusBg = 'var(--yz-bg-subtle, #F1F5F9)';
  let statusColor = 'var(--yz-text-secondary, #475569)';
  let statusBorder = 'var(--yz-border-strong, #CBD5E1)';

  if (isVoided) {
    statusLabel = 'VOIDED';
    statusBg = 'var(--yz-bg-subtle, #F8FAFC)';
    statusColor = 'var(--yz-text-muted, #64748B)';
    statusBorder = 'var(--yz-border, #CBD5E1)';
  } else if (isPaid) {
    statusLabel = 'PAID';
    statusBg = 'var(--yz-status-in-stock-bg, #DCFCE7)';
    statusColor = 'var(--yz-status-in-stock, #166534)';
    statusBorder = 'var(--yz-status-in-stock-border, #BBF7D0)';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Order ${order.orderNumber}`}
      subtitle={`Customer: ${order.customerName} • Source: ${order.location || 'Main Showroom Counter'}`}
      maxWidth="640px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top Order Information (Billing Details & Shipping Details) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--yz-bg-subtle)',
            padding: '12px 14px',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border)',
            fontSize: '11.5px',
          }}
        >
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                color: 'var(--yz-text-muted)',
                marginBottom: '3px',
              }}
            >
              Billing Details:
            </strong>
            <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
              {order.customerName}
            </div>
            {order.customerPhone && (
              <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
                Phone: {order.customerPhone}
              </div>
            )}
            <div style={{ color: 'var(--yz-text-muted)', fontSize: '11px', marginTop: '1px' }}>
              {order.customerAddress || 'Showroom In-Store Counter'}
            </div>
            <div style={{ color: 'var(--yz-text-muted)', fontSize: '10.5px', marginTop: '3px' }}>
              Showroom: {order.location || 'Main Showroom Counter'}
            </div>
          </div>

          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '10px',
                textTransform: 'uppercase',
                color: 'var(--yz-text-muted)',
                marginBottom: '3px',
              }}
            >
              Shipping & Showroom Details:
            </strong>
            <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
              Warehouse: {order.location || 'Main Showroom Counter'}
            </div>
            <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
              Order Date: {order.date}
            </div>
            <div style={{ color: 'var(--yz-text-muted)', fontSize: '11px', marginTop: '1px' }}>
              Reference SO: {order.orderNumber}
            </div>
          </div>
        </div>

        {/* Linked Bespoke Atelier Measurements */}
        {order.measurements && order.measurements.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--yz-bg-surface)',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--yz-primary, #832729)' }}>
                <Scissors size={14} />
                <span>LINKED BESPOKE ATELIER MEASUREMENTS ({order.measurements.length})</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.measurements.map((m, idx) => {
                const values = m.values || [];
                return (
                  <div
                    key={m.version_id || idx}
                    style={{
                      border: '1px solid var(--yz-border)',
                      borderRadius: 'var(--yz-radius-sm)',
                      padding: '10px 12px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: 'var(--yz-text-primary)',
                          }}
                        >
                          {m.profile_name || `${m.garment_type || 'Garment'} Fitting`}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: 'var(--yz-radius-full)',
                            backgroundColor: 'var(--yz-primary-light, #FDF2F2)',
                            color: 'var(--yz-primary, #832729)',
                            border: '1px solid var(--yz-primary, #832729)',
                          }}
                        >
                          {m.garment_type || 'Custom'} • v{m.version_number}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Printer size={12} />}
                        onClick={() => {
                          const profileMock: any = {
                            id: m.profile_id,
                            profile_name: m.profile_name || `${m.garment_type || 'Garment'} Fitting`,
                            garment_type: m.garment_type || 'Blouse',
                            notes: m.fitting_preferences,
                            current_version: {
                              id: m.version_id,
                              version_number: m.version_number,
                              is_current: true,
                              measured_at: m.measured_at,
                              measured_by: m.measured_by || 'Workshop Tailor',
                              fitting_preferences: m.fitting_preferences,
                              tailor_instructions: m.tailor_instructions,
                              order_number: order.orderNumber,
                              order_id: order.id,
                              values: values.map((v) => ({
                                field_id: v.field_id,
                                field_name: v.field_name,
                                numeric_value: v.numeric_value,
                                text_value: v.text_value,
                                unit: v.unit || 'in',
                              })),
                            },
                          };
                          setMeasurementForPrint(profileMock);
                        }}
                        title="Print Measurement Sheet (3-inch thermal printer)"
                      >
                        Print Measurement Sheet
                      </Button>
                    </div>

                    {/* Quick values pills */}
                    {values.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                        {values.map((v, valIdx) => (
                          <span
                            key={v.field_id || valIdx}
                            style={{
                              fontSize: '10.5px',
                              backgroundColor: 'var(--yz-bg-surface)',
                              border: '1px solid var(--yz-border)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontFamily: 'var(--yz-font-mono)',
                            }}
                          >
                            <span style={{ color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-sans)' }}>
                              {v.field_name}:{' '}
                            </span>
                            <strong>
                              {v.numeric_value !== null && v.numeric_value !== undefined ? `${v.numeric_value} ${v.unit || 'in'}` : (v.text_value || '—')}
                            </strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {(m.fitting_preferences || m.tailor_instructions) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px', marginTop: '4px' }}>
                        {m.fitting_preferences && (
                          <div style={{ color: 'var(--yz-text-secondary)' }}>
                            <strong style={{ color: 'var(--yz-text-primary)' }}>Fit:</strong> {m.fitting_preferences}
                          </div>
                        )}
                        {m.tailor_instructions && (
                          <div style={{ color: 'var(--yz-alert-warning-text, #92400E)' }}>
                            <strong style={{ color: 'var(--yz-alert-warning-text, #92400E)' }}>Tailor:</strong> {m.tailor_instructions}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized Garments Table */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--yz-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Products & Garments
          </div>
          <div className="yz-table-container">
            <table className="yz-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: '90px' }}>SKU</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Qty</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Price</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{it.productName}</td>
                      <td
                        style={{
                          fontFamily: 'var(--yz-font-mono)',
                          fontSize: '11px',
                          color: 'var(--yz-text-secondary)',
                        }}
                      >
                        {it.sku}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                        {it.quantity}
                      </td>
                      <td
                        style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }}
                        className="tabular-nums"
                      >
                        ₹{it.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td
                        style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}
                        className="tabular-nums"
                      >
                        ₹{(it.total || it.quantity * it.unitPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--yz-text-muted)' }}>
                      No items recorded in this order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Totals */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            borderTop: '1px solid var(--yz-border)',
            paddingTop: '8px',
          }}
        >
          <div style={{ flex: 1 }}>
            {order.notes && (
              <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>
                Notes: {order.notes}
              </div>
            )}
          </div>

          <div
            style={{
              width: '230px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11.5px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                ₹{(order.subtotal || order.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
            {order.discountTotal ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-status-in-stock, #166534)' }}>
                <span>Discount:</span>
                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                  - ₹{order.discountTotal.toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
            {order.taxTotal ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
                <span>GST Tax:</span>
                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{order.taxTotal.toLocaleString('en-IN')}
                </span>
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '13.5px',
                color: 'var(--yz-text-primary)',
                borderTop: '1px solid var(--yz-border)',
                paddingTop: '6px',
                marginTop: '2px',
              }}
            >
              <span>Grand Total:</span>
              <span style={{ fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-primary)' }}>
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div
          style={{
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-md)',
            padding: '10px 14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            textAlign: 'center',
            fontSize: '11px',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div>
            <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
              TOTAL AMOUNT
            </span>
            <strong style={{ fontSize: '14px', fontFamily: 'var(--yz-font-mono)' }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
              PAID AMOUNT
            </span>
            <strong style={{ fontSize: '14px', color: 'var(--yz-status-in-stock, #166534)', fontFamily: 'var(--yz-font-mono)' }}>
              ₹{order.paidAmount.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
              PENDING DUE
            </span>
            <strong
              style={{
                fontSize: '14px',
                color: order.pendingAmount > 0 ? 'var(--yz-status-low-stock, #B45309)' : 'var(--yz-text-secondary)',
                fontFamily: 'var(--yz-font-mono)',
              }}
            >
              ₹{order.pendingAmount.toLocaleString('en-IN')}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
              PAYMENT STATUS
            </span>
            <div style={{ marginTop: '3px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 'var(--yz-radius-full)',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  backgroundColor: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusBorder}`,
                }}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* PENDING Order Status Differentiation */}
        {order.status !== 'VOIDED' && order.paymentStatus !== 'VOIDED' && (
          order.pendingAmount > 0 || order.paymentStatus === 'PENDING'
        ) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--yz-radius-md)',
              backgroundColor: order.paidAmount > 0 ? 'var(--yz-alert-warning-bg, #FFFBEB)' : 'var(--yz-bg-subtle, #F8FAFC)',
              border: `1px solid ${order.paidAmount > 0 ? 'var(--yz-alert-warning-border, #FDE68A)' : 'var(--yz-border, #E2E8F0)'}`,
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 'var(--yz-radius-full)',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: order.paidAmount > 0 ? 'var(--yz-alert-warning-bg, #FEF3C7)' : 'var(--yz-bg-subtle, #E2E8F0)',
                  color: order.paidAmount > 0 ? 'var(--yz-alert-warning-text, #92400E)' : 'var(--yz-text-secondary, #475569)',
                }}
              >
                {order.paidAmount > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
              </span>
              <span style={{ color: order.paidAmount > 0 ? 'var(--yz-alert-warning-text, #78350F)' : 'var(--yz-text-secondary)' }}>
                {order.paidAmount > 0
                  ? `Paid: ₹${order.paidAmount.toLocaleString('en-IN')} • Balance: ₹${order.pendingAmount.toLocaleString('en-IN')}`
                  : `Unpaid: ₹0 paid • Balance: ₹${order.pendingAmount.toLocaleString('en-IN')} pending`}
              </span>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontFamily: 'var(--yz-font-mono)',
                color: order.paidAmount > 0 ? 'var(--yz-alert-warning-text, #92400E)' : 'var(--yz-text-secondary, #475569)',
              }}
            >
              Balance: ₹{order.pendingAmount.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        {/* Dedicated PAYMENT HISTORY Section */}
        <div style={{ marginTop: '2px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Payment History
            </div>
            {order.payments && order.payments.length > 0 && (
              <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
                {order.payments.length} {order.payments.length === 1 ? 'payment recorded' : 'payments recorded'}
              </span>
            )}
          </div>

          {order.status === 'VOIDED' && (
            <div
              style={{
                backgroundColor: 'var(--yz-alert-danger-bg, #FEF2F2)',
                border: '1px solid var(--yz-alert-danger-border, #FECACA)',
                borderRadius: 'var(--yz-radius-md)',
                padding: '8px 12px',
                fontSize: '11px',
                color: 'var(--yz-alert-danger-text, #991B1B)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Ban size={12} />
              <span>This order was voided. Historical payments are preserved in the audit log.</span>
            </div>
          )}

          {order.payments && order.payments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {order.payments.map((pay, idx) => (
                <div
                  key={pay.id || idx}
                  style={{
                    backgroundColor: 'var(--yz-bg-surface)',
                    border: '1px solid var(--yz-border)',
                    borderRadius: 'var(--yz-radius-sm)',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--yz-alert-success-bg, #DCFCE7)',
                        color: 'var(--yz-alert-success-text, #166534)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      #{pay.index || idx + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                          Payment #{pay.index || idx + 1}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 'var(--yz-radius-sm)',
                            fontSize: '9.5px',
                            fontWeight: 600,
                            backgroundColor: 'var(--yz-alert-success-bg, #DCFCE7)',
                            color: 'var(--yz-alert-success-text, #166534)',
                          }}
                        >
                          {pay.status || 'Successful'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '1px' }}>
                        <span>Date: {formatDisplayDate(pay.date || pay.paymentDate)}</span>
                        <span style={{ margin: '0 5px' }}>•</span>
                        <span>Method: {pay.paymentMode}</span>
                        {pay.referenceNumber && (
                          <>
                            <span style={{ margin: '0 5px' }}>•</span>
                            <span style={{ fontFamily: 'var(--yz-font-mono)' }}>Ref: {pay.referenceNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        color: 'var(--yz-status-in-stock, #166534)',
                        fontSize: '12.5px',
                      }}
                    >
                      ₹{pay.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Remaining Balance Summary */}
              {order.pendingAmount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    backgroundColor: 'var(--yz-alert-warning-bg, #FFFBEB)',
                    border: '1px solid var(--yz-alert-warning-border, #FDE68A)',
                    borderRadius: 'var(--yz-radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--yz-alert-warning-text, #92400E)',
                  }}
                >
                  <span>Remaining Balance:</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '12px' }}>
                    ₹{order.pendingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                backgroundColor: 'var(--yz-bg-subtle)',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px dashed var(--yz-border)',
                fontSize: '11px',
                color: 'var(--yz-text-muted)',
              }}
            >
              No payments recorded • Full balance due: ₹{order.totalAmount.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* Printable Workshop Tailor Slip Modal */}
      {measurementForPrint && (
        <PrintTailorSheetModal
          isOpen={true}
          onClose={() => setMeasurementForPrint(null)}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
          profile={measurementForPrint}
          version={measurementForPrint.current_version}
          orderNumber={order.orderNumber}
          orderId={order.id}
          orderDate={order.date}
        />
      )}
    </Modal>
  );
};
