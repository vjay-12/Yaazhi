import React from 'react';
import {
  Scissors,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import type { StitchingReportData } from '../../../services/reportService';

interface StitchingTailoringTabProps {
  stitching: StitchingReportData;
  periodLabel: string;
}

export const StitchingTailoringTab: React.FC<StitchingTailoringTabProps> = ({
  stitching,
  periodLabel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. STITCHING KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Total Stitching Revenue */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', textTransform: 'uppercase' }}>
              Stitching Service Revenue
            </span>
            <Scissors size={15} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(stitching.total_stitching_revenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Earned in {periodLabel}
          </div>
        </div>

        {/* Services Ordered */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Services Ordered
            </span>
            <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>Work Units</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {stitching.total_services_ordered}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>services</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Across {stitching.total_stitching_orders} work orders
          </div>
        </div>

        {/* In-Progress Pipeline */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              In Tailoring Pipeline
            </span>
            <Clock size={15} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {stitching.pipeline.in_progress}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Under tailoring execution
          </div>
        </div>

        {/* Completed & Delivered */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Completed & Delivered
            </span>
            <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {stitching.pipeline.completed_delivered}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Fulfilled and handed over
          </div>
        </div>

        {/* Overdue Orders Alert */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Overdue Deliveries
            </span>
            <AlertTriangle size={15} style={{ color: stitching.pipeline.overdue_work > 0 ? '#dc2626' : '#16a34a' }} />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: stitching.pipeline.overdue_work > 0 ? '#dc2626' : '#16a34a',
              marginTop: '4px',
              fontFamily: 'var(--yz-font-mono)',
            }}
          >
            {stitching.pipeline.overdue_work}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>orders</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Past expected delivery date
          </div>
        </div>
      </div>

      {/* 2. OVERDUE ORDERS ALERT TABLE (IF ANY) */}
      {stitching.overdue_orders.length > 0 && (
        <div
          className="yz-card"
          style={{
            padding: '14px',
            backgroundColor: 'rgba(220, 38, 38, 0.04)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#dc2626' }} />
              <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#991b1b' }}>
                Urgent Action Required: {stitching.overdue_orders.length} Overdue Stitching Order(s)
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#b91c1c' }}>Delivery timeline exceeded</span>
          </div>

          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>ORDER #</th>
                  <th>CUSTOMER</th>
                  <th style={{ width: '110px' }}>PHONE</th>
                  <th style={{ width: '120px' }}>GARMENT</th>
                  <th style={{ width: '110px' }}>ORDER DATE</th>
                  <th style={{ width: '120px' }}>EXPECTED DUE</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>REVENUE</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {stitching.overdue_orders.map((oo) => (
                  <tr key={oo.id}>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: '#991b1b' }}>
                      {oo.order_number}
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{oo.customer_name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {oo.customer_phone || '-'}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--yz-bg-subtle)' }}>
                        {oo.garment_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {oo.order_date}
                    </td>
                    <td style={{ fontSize: '11.5px', fontWeight: 600, color: '#dc2626' }}>
                      {oo.expected_delivery || 'Not Set'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(oo.revenue).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', backgroundColor: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>
                        OVERDUE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BREAKDOWN BY GARMENT TYPE & PRICING TEMPLATE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Garment Type Breakdown */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Revenue by Garment Type
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {stitching.garment_breakdown.length} garment classes
            </span>
          </div>

          {stitching.garment_breakdown.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No stitching orders by garment for this period.
            </div>
          ) : (
            <div className="yz-table-container">
              <table className="yz-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>GARMENT</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>ORDERS</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {stitching.garment_breakdown.map((gb, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{gb.garment_type}</strong>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                        {gb.count}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                        ₹{Math.round(gb.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pricing Template Breakdown */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Revenue by Service / Pricing Template
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              Popular templates & finishes
            </span>
          </div>

          {stitching.template_breakdown.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No service template data for this period.
            </div>
          ) : (
            <div className="yz-table-container">
              <table className="yz-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>SERVICE TEMPLATE</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>COUNT</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  {stitching.template_breakdown.map((tb, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{tb.name}</strong>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                        {tb.count}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                        ₹{Math.round(tb.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. COMPREHENSIVE STITCHING WORK ORDERS TABLE */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Stitching Work Orders Ledger ({stitching.orders.length} Orders)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Execution statuses independent of billing payments
          </span>
        </div>

        {stitching.orders.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No tailoring work orders found for this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>ORDER #</th>
                  <th>CUSTOMER</th>
                  <th style={{ width: '110px' }}>PHONE</th>
                  <th style={{ width: '110px' }}>GARMENT</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>SERVICES</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>REVENUE</th>
                  <th style={{ width: '100px' }}>ORDER DATE</th>
                  <th style={{ width: '110px' }}>EXPECTED DUE</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>JOB STATUS</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>MEASUREMENTS</th>
                </tr>
              </thead>
              <tbody>
                {stitching.orders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                      {ord.order_number}
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{ord.customer_name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {ord.customer_phone || '-'}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--yz-bg-subtle)' }}>
                        {ord.garment_type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                      {ord.service_count}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(ord.stitching_revenue).toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {ord.order_date}
                    </td>
                    <td
                      style={{
                        fontSize: '11.5px',
                        color: ord.status === 'OVERDUE' ? '#dc2626' : 'var(--yz-text-secondary)',
                        fontWeight: ord.status === 'OVERDUE' ? 600 : 400,
                      }}
                    >
                      {ord.expected_delivery || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-full)',
                          backgroundColor:
                            ord.status === 'DELIVERED'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : ord.status === 'OVERDUE'
                              ? 'rgba(220, 38, 38, 0.1)'
                              : 'rgba(2, 132, 199, 0.1)',
                          color:
                            ord.status === 'DELIVERED'
                              ? '#16a34a'
                              : ord.status === 'OVERDUE'
                              ? '#dc2626'
                              : '#0284c7',
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {ord.has_measurements ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(22, 163, 74, 0.1)',
                            color: '#16a34a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Check size={11} /> Linked
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
                          Standard
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
