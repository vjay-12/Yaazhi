import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ruler,
  Scissors,
  Plus,
  Search,
  RotateCcw,
  Archive,
  RefreshCw,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/LoadingState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { templateService } from '../../services/templateService';
import type {
  MeasurementTemplate,
  StitchingTemplate,
} from '../../types/template';
import { MeasurementTemplateModal } from './MeasurementTemplateModal';
import { StitchingTemplateModal } from './StitchingTemplateModal';
import { TemplatePreviewModal } from './TemplatePreviewModal';

type ActiveTab = 'measurements' | 'stitching';
type StatusFilter = 'active' | 'archived' | 'all';

const GARMENT_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Garments' },
  { value: 'Blouse', label: 'Blouse' },
  { value: 'Chudidar', label: 'Chudidar' },
  { value: 'Kurti', label: 'Kurti' },
  { value: 'Shirt', label: 'Shirt' },
  { value: 'Trousers', label: 'Trousers' },
  { value: 'Lehenga', label: 'Lehenga' },
  { value: 'Other', label: 'Other' },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'MEN', label: 'Men' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'KIDS', label: 'Kids' },
];

export const TemplatesPage: React.FC = () => {
  const { showToast } = useToast();

  // Top Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('measurements');

  // Data States
  const [measurementTemplates, setMeasurementTemplates] = useState<MeasurementTemplate[]>([]);
  const [stitchingTemplates, setStitchingTemplates] = useState<StitchingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGarment, setSelectedGarment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [measurementToEdit, setMeasurementToEdit] = useState<MeasurementTemplate | null>(null);

  const [isStitchingModalOpen, setIsStitchingModalOpen] = useState(false);
  const [stitchingToEdit, setStitchingToEdit] = useState<StitchingTemplate | null>(null);

  const [previewMeasurement, setPreviewMeasurement] = useState<MeasurementTemplate | null>(null);
  const [previewStitching, setPreviewStitching] = useState<StitchingTemplate | null>(null);

  // Confirm Dialog States
  const [archiveTarget, setArchiveTarget] = useState<{
    id: string;
    name: string;
    type: 'measurement' | 'stitching';
  } | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{
    id: string;
    name: string;
    type: 'measurement' | 'stitching';
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'measurement' | 'stitching';
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load Data
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mTemplates, sTemplates] = await Promise.all([
        templateService.getMeasurementTemplates({ include_archived: true }),
        templateService.getStitchingTemplates({ include_archived: true }),
      ]);
      setMeasurementTemplates(mTemplates || []);
      setStitchingTemplates(sTemplates || []);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      showToast({
        type: 'error',
        title: 'Fetch Failed',
        message: err.message || 'Could not load atelier templates',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Reset pagination on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedGarment, selectedCategory, statusFilter]);

  // Filtered Measurement Templates
  const filteredMeasurementTemplates = useMemo(() => {
    return measurementTemplates.filter((t) => {
      // Lifecycle status filter
      if (statusFilter === 'active' && (t.is_archived || t.is_active === false)) return false;
      if (statusFilter === 'archived' && !t.is_archived) return false;

      // Garment filter
      if (selectedGarment !== 'ALL' && t.garment_type !== selectedGarment) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchGarment = (t.garment_type || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc && !matchGarment) return false;
      }

      return true;
    });
  }, [measurementTemplates, statusFilter, selectedGarment, selectedCategory, searchQuery]);

  // Filtered Stitching Templates
  const filteredStitchingTemplates = useMemo(() => {
    return stitchingTemplates.filter((t) => {
      // Lifecycle status filter
      if (statusFilter === 'active' && (t.is_archived || t.is_active === false)) return false;
      if (statusFilter === 'archived' && !t.is_archived) return false;

      // Garment filter
      if (selectedGarment !== 'ALL' && t.garment_type !== selectedGarment) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchGarment = (t.garment_type || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc && !matchGarment) return false;
      }

      return true;
    });
  }, [stitchingTemplates, statusFilter, selectedGarment, selectedCategory, searchQuery]);

  // Paginated Slices
  const activeList = activeTab === 'measurements' ? filteredMeasurementTemplates : filteredStitchingTemplates;
  const totalItems = activeList.length;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeList.slice(start, start + pageSize);
  }, [activeList, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const totalM = measurementTemplates.length;
    const activeM = measurementTemplates.filter((t) => !t.is_archived && t.is_active !== false).length;
    const totalS = stitchingTemplates.length;
    const activeS = stitchingTemplates.filter((t) => !t.is_archived && t.is_active !== false).length;
    const totalProfilesLinked = measurementTemplates.reduce(
      (sum, t) => sum + (t._count?.profiles ?? 0),
      0
    );
    const totalAddons = stitchingTemplates.reduce(
      (sum, t) => sum + (t.addons?.length || 0),
      0
    );

    return { totalM, activeM, totalS, activeS, totalProfilesLinked, totalAddons };
  }, [measurementTemplates, stitchingTemplates]);

  // Handlers for Measurement Templates
  const handleSaveMeasurementTemplate = async (data: any) => {
    if (measurementToEdit) {
      await templateService.updateMeasurementTemplate(measurementToEdit.id, data);
      showToast({
        type: 'success',
        title: 'Template Updated',
        message: `Updated fitting specifications for "${data.name}"`,
      });
    } else {
      await templateService.createMeasurementTemplate(data);
      showToast({
        type: 'success',
        title: 'Template Created',
        message: `Created new fitting template "${data.name}"`,
      });
    }
    await loadTemplates();
  };

  // Handlers for Stitching Templates
  const handleSaveStitchingTemplate = async (data: any) => {
    if (stitchingToEdit) {
      await templateService.updateStitchingTemplate(stitchingToEdit.id, data);
      showToast({
        type: 'success',
        title: 'Service Rate Updated',
        message: `Updated stitching rates for "${data.name}"`,
      });
    } else {
      await templateService.createStitchingTemplate(data);
      showToast({
        type: 'success',
        title: 'Service Rate Created',
        message: `Added new stitching service "${data.name}" to atelier catalog`,
      });
    }
    await loadTemplates();
  };

  // Confirm Archive
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      setIsActionLoading(true);
      if (archiveTarget.type === 'measurement') {
        await templateService.archiveMeasurementTemplate(archiveTarget.id);
      } else {
        await templateService.archiveStitchingTemplate(archiveTarget.id);
      }
      showToast({
        type: 'info',
        title: 'Template Archived',
        message: `"${archiveTarget.name}" archived. Existing customer measurements & orders remain preserved.`,
      });
      setArchiveTarget(null);
      await loadTemplates();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive template',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Restore
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      setIsActionLoading(true);
      if (restoreTarget.type === 'measurement') {
        await templateService.restoreMeasurementTemplate(restoreTarget.id);
      } else {
        await templateService.restoreStitchingTemplate(restoreTarget.id);
      }
      showToast({
        type: 'success',
        title: 'Template Restored',
        message: `"${restoreTarget.name}" restored to active directory.`,
      });
      setRestoreTarget(null);
      await loadTemplates();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Could not restore template',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Confirm Delete (Only for archived templates)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsActionLoading(true);
      if (deleteTarget.type === 'measurement') {
        await templateService.deleteMeasurementTemplate(deleteTarget.id);
      } else {
        await templateService.deleteStitchingTemplate(deleteTarget.id);
      }
      showToast({
        type: 'success',
        title: 'Template Deleted',
        message: `Permanently removed "${deleteTarget.name}"`,
      });
      setDeleteTarget(null);
      await loadTemplates();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cannot Delete Template',
        message: err.message || 'Could not delete template',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Compact KPI Stat Cards (Matching Products & Stock Layout) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Measurement Templates</span>
          <span className="yz-stat-value tabular-nums">{stats.activeM}</span>
          <span className="yz-stat-subtext">
            {stats.activeM} active ({stats.totalM} total)
          </span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Stitching Rate Templates</span>
          <span className="yz-stat-value tabular-nums">{stats.activeS}</span>
          <span className="yz-stat-subtext">
            {stats.activeS} active ({stats.totalS} total)
          </span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Client Fitting Records</span>
          <span className="yz-stat-value tabular-nums">{stats.totalProfilesLinked}</span>
          <span className="yz-stat-subtext">{stats.totalProfilesLinked} profiles protected</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Atelier Add-on Finishes</span>
          <span className="yz-stat-value tabular-nums">{stats.totalAddons}</span>
          <span className="yz-stat-subtext">{stats.totalAddons} options cataloged</span>
        </div>
      </div>

      {/* 2. Main Section Container */}
      <div
        style={{
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Switcher & Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderBottom: '1px solid var(--yz-border)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {/* Left: Tab Switcher Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('measurements')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor:
                  activeTab === 'measurements' ? 'var(--yz-bg-surface)' : 'transparent',
                color:
                  activeTab === 'measurements'
                    ? 'var(--yz-primary)'
                    : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'measurements' ? 600 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow:
                  activeTab === 'measurements' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Ruler size={14} />
              <span>Customer Measurement Templates</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor:
                    activeTab === 'measurements'
                      ? 'var(--yz-primary-subtle)'
                      : 'var(--yz-bg-canvas)',
                  color:
                    activeTab === 'measurements'
                      ? 'var(--yz-primary)'
                      : 'var(--yz-text-muted)',
                }}
              >
                {filteredMeasurementTemplates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stitching')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor:
                  activeTab === 'stitching' ? 'var(--yz-bg-surface)' : 'transparent',
                color:
                  activeTab === 'stitching'
                    ? 'var(--yz-primary)'
                    : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'stitching' ? 600 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow:
                  activeTab === 'stitching' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Scissors size={14} />
              <span>Stitching Price Templates</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor:
                    activeTab === 'stitching'
                      ? 'var(--yz-primary-subtle)'
                      : 'var(--yz-bg-canvas)',
                  color:
                    activeTab === 'stitching'
                      ? 'var(--yz-primary)'
                      : 'var(--yz-text-muted)',
                }}
              >
                {filteredStitchingTemplates.length}
              </span>
            </button>
          </div>

          {/* Right: Active/Archived/All Filter AND New Template Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status Filter Segmented Control */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--yz-bg-canvas)',
                borderRadius: 'var(--yz-radius-md)',
                padding: '2px',
                border: '1px solid var(--yz-border)',
              }}
            >
              {(['active', 'archived', 'all'] as StatusFilter[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: 'none',
                    backgroundColor: statusFilter === st ? 'var(--yz-bg-surface)' : 'transparent',
                    color: statusFilter === st ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)',
                    fontSize: '11.5px',
                    fontWeight: statusFilter === st ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: statusFilter === st ? 'var(--yz-shadow-xs)' : 'none',
                    textTransform: 'capitalize',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={loadTemplates}
              disabled={isLoading}
              title="Refresh templates"
              style={{
                height: '30px',
                width: '30px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RefreshCw size={13} className={isLoading ? 'yz-spin' : ''} />
            </Button>

            {/* New Template Button */}
            {activeTab === 'measurements' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setMeasurementToEdit(null);
                  setIsMeasurementModalOpen(true);
                }}
                style={{ height: '30px', fontSize: '11.5px', fontWeight: 600 }}
              >
                <Plus size={14} style={{ marginRight: '4px' }} /> New Measurement Template
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setStitchingToEdit(null);
                  setIsStitchingModalOpen(true);
                }}
                style={{ height: '30px', fontSize: '11.5px', fontWeight: 600 }}
              >
                <Plus size={14} style={{ marginRight: '4px' }} /> New Stitching Rate Template
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--yz-border)',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder={
                activeTab === 'measurements'
                  ? 'Search measurement templates by name, garment, or code...'
                  : 'Search stitching rate templates by name, garment, or code...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '28px', height: '32px', fontSize: '11.5px', width: '100%' }}
            />
          </div>

          {/* Garment Dropdown */}
          <div style={{ width: '140px' }}>
            <CustomDropdown
              value={selectedGarment}
              onChange={(val) => setSelectedGarment(val as string)}
              options={GARMENT_FILTER_OPTIONS}
              placeholder="All Garments"
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ width: '140px' }}>
            <CustomDropdown
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as string)}
              options={CATEGORY_FILTER_OPTIONS}
              placeholder="All Categories"
            />
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedGarment !== 'ALL' || selectedCategory !== 'ALL' || statusFilter !== 'active') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedGarment('ALL');
                setSelectedCategory('ALL');
                setStatusFilter('active');
              }}
              style={{ height: '32px', fontSize: '11.5px' }}
            >
              <RotateCcw size={13} style={{ marginRight: '4px' }} /> Reset
            </Button>
          )}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div style={{ padding: '24px 16px' }}>
            <TableSkeleton rows={5} columns={5} />
          </div>
        ) : paginatedList.length === 0 ? (
          <div style={{ padding: '40px 16px' }}>
            <EmptyState
              title={
                statusFilter === 'archived'
                  ? `No archived ${activeTab === 'measurements' ? 'measurement templates' : 'stitching templates'}`
                  : `No ${activeTab === 'measurements' ? 'measurement templates' : 'stitching templates'} found`
              }
              description={
                statusFilter === 'archived'
                  ? 'There are currently no archived templates in this category.'
                  : 'Try adjusting your search criteria, garment filter, or create a new template.'
              }
              actionLabel={statusFilter === 'archived' ? undefined : 'Create Template'}
              onAction={
                statusFilter === 'archived'
                  ? undefined
                  : () => {
                      if (activeTab === 'measurements') {
                        setMeasurementToEdit(null);
                        setIsMeasurementModalOpen(true);
                      } else {
                        setStitchingToEdit(null);
                        setIsStitchingModalOpen(true);
                      }
                    }
              }
            />
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px' }}>
                    {activeTab === 'measurements' ? 'TEMPLATE NAME' : 'SERVICE NAME'}
                  </th>
                  <th style={{ padding: '8px 10px', width: '120px' }}>GARMENT TYPE</th>
                  <th style={{ padding: '8px 10px', width: '110px' }}>CATEGORY</th>
                  {activeTab === 'measurements' ? (
                    <>
                      <th style={{ padding: '8px 10px', width: '100px' }}>PARAMETERS</th>
                      <th style={{ padding: '8px 10px', width: '130px' }}>PROFILES LINKED</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '8px 10px', width: '130px' }}>STANDARD BASE</th>
                      <th style={{ padding: '8px 10px', width: '100px' }}>TAX / GST</th>
                      <th style={{ padding: '8px 10px', width: '130px' }}>ADD-ON FINISHES</th>
                    </>
                  )}
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((item: any) => {
                  const isM = activeTab === 'measurements';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (isM) {
                          setPreviewMeasurement(item);
                        } else {
                          setPreviewStitching(item);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Click to view details"
                    >
                      {/* Name & Code */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--yz-text-muted)',
                            fontFamily: 'var(--yz-font-mono)',
                            marginTop: '1px',
                          }}
                        >
                          {item.code}
                          {item.is_default && (
                            <span
                              style={{
                                marginLeft: '6px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--yz-gold-subtle)',
                                color: 'var(--yz-gold)',
                                fontSize: '10px',
                                fontWeight: 600,
                              }}
                            >
                              Default
                            </span>
                          )}
                          {item.is_archived && (
                            <span
                              style={{
                                marginLeft: '6px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--yz-status-out-stock-bg, #FEF2F2)',
                                color: 'var(--yz-status-out-stock, #DC2626)',
                                border: '1px solid var(--yz-status-out-stock-border, #FECACA)',
                                fontSize: '10px',
                                fontWeight: 600,
                              }}
                            >
                              Archived
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Garment Type */}
                      <td style={{ padding: '8px 10px' }}>
                        <Badge variant="neutral">{item.garment_type || 'Other'}</Badge>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                          {item.category}
                        </span>
                      </td>

                      {/* Dynamic Columns based on Tab */}
                      {isM ? (
                        <>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                                {item.fields?.length || 0}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                                fields
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                color:
                                  (item._count?.profiles ?? 0) > 0
                                    ? 'var(--yz-primary)'
                                    : 'var(--yz-text-muted)',
                                fontWeight: (item._count?.profiles ?? 0) > 0 ? 600 : 400,
                              }}
                            >
                              {item._count?.profiles ?? 0} client fitting
                              {item._count?.profiles === 1 ? '' : 's'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '8px 10px' }}>
                            <strong style={{ color: 'var(--yz-primary)', fontFamily: 'var(--yz-font-mono)' }}>
                              ₹
                              {parseFloat(String(item.base_price)).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                              {parseFloat(String(item.tax_rate))}% GST
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                              {item.addons?.length || 0} add-on{item.addons?.length === 1 ? '' : 's'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td
                        style={{ padding: '8px 12px', textAlign: 'right' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          {!item.is_archived ? (
                            <>
                              {/* Edit Action for Active Templates */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isM) {
                                    setMeasurementToEdit(item);
                                    setIsMeasurementModalOpen(true);
                                  } else {
                                    setStitchingToEdit(item);
                                    setIsStitchingModalOpen(true);
                                  }
                                }}
                                style={{
                                  padding: '4px 7px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--yz-border)',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  color: 'var(--yz-text-secondary)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Edit template"
                              >
                                <Edit size={13} />
                              </button>

                              {/* Archive Action for Active Templates */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setArchiveTarget({
                                    id: item.id,
                                    name: item.name,
                                    type: isM ? 'measurement' : 'stitching',
                                  });
                                }}
                                style={{
                                  padding: '4px 7px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--yz-border)',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  color: 'var(--yz-status-low-stock, #d97706)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Archive template"
                              >
                                <Archive size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Restore Action for Archived Templates */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestoreTarget({
                                    id: item.id,
                                    name: item.name,
                                    type: isM ? 'measurement' : 'stitching',
                                  });
                                }}
                                style={{
                                  padding: '4px 7px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--yz-border)',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  color: 'var(--yz-status-in-stock, #16a34a)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Restore template"
                              >
                                <RotateCcw size={13} />
                              </button>

                              {/* Delete Action: ONLY for Archived Templates */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({
                                    id: item.id,
                                    name: item.name,
                                    type: isM ? 'measurement' : 'stitching',
                                  });
                                }}
                                style={{
                                  padding: '4px 7px',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--yz-border)',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  color: 'var(--yz-status-out-stock, #dc2626)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Delete permanently"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > pageSize && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--yz-border)' }}>
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="templates"
            />
          </div>
        )}
      </div>

      {/* Measurement Template Edit/Create Modal */}
      <MeasurementTemplateModal
        isOpen={isMeasurementModalOpen}
        onClose={() => {
          setIsMeasurementModalOpen(false);
          setMeasurementToEdit(null);
        }}
        onSubmit={handleSaveMeasurementTemplate}
        templateToEdit={measurementToEdit}
      />

      {/* Stitching Template Edit/Create Modal */}
      <StitchingTemplateModal
        isOpen={isStitchingModalOpen}
        onClose={() => {
          setIsStitchingModalOpen(false);
          setStitchingToEdit(null);
        }}
        onSubmit={handleSaveStitchingTemplate}
        templateToEdit={stitchingToEdit}
      />

      {/* Template Preview / Details Modal (View Only, Closed via Top-Right X) */}
      <TemplatePreviewModal
        isOpen={Boolean(previewMeasurement || previewStitching)}
        onClose={() => {
          setPreviewMeasurement(null);
          setPreviewStitching(null);
        }}
        measurementTemplate={previewMeasurement}
        stitchingTemplate={previewStitching}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Template"
        description={
          archiveTarget ? (
            <span>
              Are you sure you want to archive <strong>"{archiveTarget.name}"</strong>?
              <br />
              <br />
              This template will be hidden from new order selection. All existing customer
              measurements, fitting histories, and past sales orders will remain intact and safe.
            </span>
          ) : undefined
        }
        confirmLabel="Archive Template"
        variant="warning"
        isLoading={isActionLoading}
      />

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleConfirmRestore}
        title="Restore Template"
        description={
          restoreTarget ? (
            <span>
              Restore <strong>"{restoreTarget.name}"</strong> to the active template directory?
            </span>
          ) : undefined
        }
        confirmLabel="Restore to Active"
        variant="primary"
        isLoading={isActionLoading}
      />

      {/* Confirm Delete Dialog (For Archived Templates) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Template Permanently"
        description={
          deleteTarget ? (
            <span>
              Are you sure you want to permanently delete <strong>"{deleteTarget.name}"</strong>?
              <br />
              <br />
              <span style={{ color: 'var(--yz-status-out-stock)' }}>
                Warning: Templates linked to existing customer measurement profiles cannot be deleted.
                In such cases, archiving is recommended instead.
              </span>
            </span>
          ) : undefined
        }
        confirmLabel="Delete Permanently"
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default TemplatesPage;
