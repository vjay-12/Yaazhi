import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ruler,
  Scissors,
  Plus,
  Search,
  RotateCcw,
  Copy,
  Archive,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
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
      // Status filter
      if (statusFilter === 'active' && t.is_archived) return false;
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
      // Status filter
      if (statusFilter === 'active' && t.is_archived) return false;
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
    const activeM = measurementTemplates.filter((t) => !t.is_archived).length;
    const totalS = stitchingTemplates.length;
    const activeS = stitchingTemplates.filter((t) => !t.is_archived).length;
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

  // Duplication
  const handleDuplicate = async (id: string, type: 'measurement' | 'stitching') => {
    try {
      if (type === 'measurement') {
        const cloned = await templateService.duplicateMeasurementTemplate(id);
        showToast({
          type: 'success',
          title: 'Template Cloned',
          message: `Created duplicate "${cloned.name}"`,
        });
      } else {
        const cloned = await templateService.duplicateStitchingTemplate(id);
        showToast({
          type: 'success',
          title: 'Service Rate Cloned',
          message: `Created duplicate "${cloned.name}" with add-ons`,
        });
      }
      await loadTemplates();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Duplication Failed',
        message: err.message || 'Could not duplicate template',
      });
    }
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
        message: `"${restoreTarget.name}" restored to active templates.`,
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

  // Confirm Delete
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--yz-text-primary)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Unified Templates & Catalogs
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--yz-text-secondary)', margin: 0 }}>
            Configure client measurement fitting parameters and standard atelier stitching service price rates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="secondary" size="md" onClick={loadTemplates} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'yz-spin' : ''} style={{ marginRight: '6px' }} /> Refresh
          </Button>
          {activeTab === 'measurements' ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setMeasurementToEdit(null);
                setIsMeasurementModalOpen(true);
              }}
            >
              <Plus size={15} style={{ marginRight: '6px' }} /> New Measurement Template
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setStitchingToEdit(null);
                setIsStitchingModalOpen(true);
              }}
            >
              <Plus size={15} style={{ marginRight: '6px' }} /> New Stitching Rate Template
            </Button>
          )}
        </div>
      </div>

      {/* Functional Distinction Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--yz-radius-md)',
            backgroundColor: 'var(--yz-primary-subtle)',
            color: 'var(--yz-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {activeTab === 'measurements' ? <Ruler size={18} /> : <Scissors size={18} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
            {activeTab === 'measurements'
              ? 'Customer Measurement Templates'
              : 'Stitching Price & Service Templates'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--yz-text-muted)', lineHeight: 1.4 }}>
            {activeTab === 'measurements'
              ? 'Defines what tailor parameters, units, and guidelines to collect during client fittings (e.g. blouse length, bust, armhole, neckline cut). Editing fields does not silently alter historical customer measurement records.'
              : 'Defines baseline atelier service rates, applicable GST rates, and optional add-on finishes (lining, embroidery, express delivery). Baseline prices remain protected and separate from custom orders.'}
          </div>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Measurement Templates
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            {stats.activeM}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--yz-text-muted)' }}>
              active ({stats.totalM} total)
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Stitching Rate Templates
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            {stats.activeS}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--yz-text-muted)' }}>
              active ({stats.totalS} total)
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Client Fitting Records Linked
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            {stats.totalProfilesLinked}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--yz-text-muted)' }}>
              profiles protected
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Atelier Add-on Finishes
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            {stats.totalAddons}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--yz-text-muted)' }}>
              options cataloged
            </span>
          </div>
        </div>
      </div>

      {/* Main Section Container */}
      <div
        style={{
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Switcher Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderBottom: '1px solid var(--yz-border)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('measurements')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor:
                  activeTab === 'measurements' ? 'var(--yz-bg-surface)' : 'transparent',
                color:
                  activeTab === 'measurements'
                    ? 'var(--yz-primary)'
                    : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'measurements' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  activeTab === 'measurements' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Ruler size={15} />
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
              onClick={() => setActiveTab('stitching')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor:
                  activeTab === 'stitching' ? 'var(--yz-bg-surface)' : 'transparent',
                color:
                  activeTab === 'stitching'
                    ? 'var(--yz-primary)'
                    : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'stitching' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow:
                  activeTab === 'stitching' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Scissors size={15} />
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
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: 'none',
                  backgroundColor: statusFilter === st ? 'var(--yz-bg-surface)' : 'transparent',
                  color: statusFilter === st ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)',
                  fontSize: '12px',
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
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--yz-border-subtle)',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === 'measurements' ? 'measurement templates' : 'stitching services'}...`}
              style={{
                width: '100%',
                height: 'var(--yz-control-height-md)',
                paddingLeft: '32px',
                paddingRight: '12px',
                borderRadius: 'var(--yz-input-radius)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-canvas)',
                color: 'var(--yz-text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Garment Type Dropdown */}
          <div style={{ width: '170px' }}>
            <CustomDropdown
              value={selectedGarment}
              onChange={(val) => setSelectedGarment(val as string)}
              options={GARMENT_FILTER_OPTIONS}
              placeholder="Garment Type"
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ width: '160px' }}>
            <CustomDropdown
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as string)}
              options={CATEGORY_FILTER_OPTIONS}
              placeholder="Category"
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
            >
              <RotateCcw size={13} style={{ marginRight: '4px' }} /> Reset
            </Button>
          )}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div style={{ padding: '24px 16px' }}>
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : paginatedList.length === 0 ? (
          <div style={{ padding: '40px 16px' }}>
            <EmptyState
              title={`No ${activeTab === 'measurements' ? 'measurement templates' : 'stitching templates'} found`}
              description="Try adjusting your search criteria, garment filter, or create a new template."
              actionLabel="Create Template"
              onAction={() => {
                if (activeTab === 'measurements') {
                  setMeasurementToEdit(null);
                  setIsMeasurementModalOpen(true);
                } else {
                  setStitchingToEdit(null);
                  setIsStitchingModalOpen(true);
                }
              }}
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--yz-bg-subtle)',
                    borderBottom: '1px solid var(--yz-border)',
                    color: 'var(--yz-text-secondary)',
                    fontWeight: 600,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '10px 16px' }}>
                    {activeTab === 'measurements' ? 'Template Name' : 'Service Name'}
                  </th>
                  <th style={{ padding: '10px 14px' }}>Garment Type</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  {activeTab === 'measurements' ? (
                    <>
                      <th style={{ padding: '10px 14px' }}>Parameters</th>
                      <th style={{ padding: '10px 14px' }}>Profiles Linked</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '10px 14px' }}>Standard Base</th>
                      <th style={{ padding: '10px 14px' }}>Tax / GST</th>
                      <th style={{ padding: '10px 14px' }}>Add-on Finishes</th>
                    </>
                  )}
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((item: any) => {
                  const isM = activeTab === 'measurements';
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--yz-border-subtle)',
                        backgroundColor: 'var(--yz-bg-surface)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface)';
                      }}
                    >
                      {/* Name & Code */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--yz-text-muted)',
                            fontFamily: 'var(--yz-font-mono)',
                            marginTop: '2px',
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
                        </div>
                      </td>

                      {/* Garment Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <Badge variant="neutral">{item.garment_type || 'Other'}</Badge>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                          {item.category}
                        </span>
                      </td>

                      {/* Dynamic Columns based on Tab */}
                      {isM ? (
                        <>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600 }}>{item.fields?.length || 0}</span>
                              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                                fields
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
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
                              {item._count?.profiles ?? 0} client fitting{item._count?.profiles === 1 ? '' : 's'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ color: 'var(--yz-primary)' }}>
                              ₹
                              {parseFloat(String(item.base_price)).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                              {parseFloat(String(item.tax_rate))}% GST
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                              {item.addons?.length || 0} add-on{item.addons?.length === 1 ? '' : 's'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <Badge variant={item.is_archived ? 'danger' : 'success'}>
                          {item.is_archived ? 'Archived' : 'Active'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          {/* Preview / Simulate */}
                          <button
                            onClick={() => {
                              if (isM) {
                                setPreviewMeasurement(item);
                              } else {
                                setPreviewStitching(item);
                              }
                            }}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                              color: 'var(--yz-text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Preview specifications"
                          >
                            <Eye size={13} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              if (isM) {
                                setMeasurementToEdit(item);
                                setIsMeasurementModalOpen(true);
                              } else {
                                setStitchingToEdit(item);
                                setIsStitchingModalOpen(true);
                              }
                            }}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                              color: 'var(--yz-text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Edit template"
                          >
                            <Edit size={13} />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(item.id, isM ? 'measurement' : 'stitching')}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                              color: 'var(--yz-text-secondary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Duplicate template"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Archive / Restore */}
                          {item.is_archived ? (
                            <button
                              onClick={() =>
                                setRestoreTarget({
                                  id: item.id,
                                  name: item.name,
                                  type: isM ? 'measurement' : 'stitching',
                                })
                              }
                              style={{
                                padding: '5px 8px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--yz-border)',
                                borderRadius: 'var(--yz-radius-sm)',
                                color: 'var(--yz-status-in-stock)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Restore template"
                            >
                              <RotateCcw size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setArchiveTarget({
                                  id: item.id,
                                  name: item.name,
                                  type: isM ? 'measurement' : 'stitching',
                                })
                              }
                              style={{
                                padding: '5px 8px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--yz-border)',
                                borderRadius: 'var(--yz-radius-sm)',
                                color: 'var(--yz-status-low-stock)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                              title="Archive template"
                            >
                              <Archive size={13} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: item.id,
                                name: item.name,
                                type: isM ? 'measurement' : 'stitching',
                              })
                            }
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                              color: 'var(--yz-status-out-stock)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalItems > pageSize && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--yz-border-subtle)' }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="templates"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Measurement Template Modal */}
      <MeasurementTemplateModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        onSubmit={handleSaveMeasurementTemplate}
        templateToEdit={measurementToEdit}
      />

      {/* Stitching Template Modal */}
      <StitchingTemplateModal
        isOpen={isStitchingModalOpen}
        onClose={() => setIsStitchingModalOpen(false)}
        onSubmit={handleSaveStitchingTemplate}
        templateToEdit={stitchingToEdit}
      />

      {/* Preview Modal */}
      <TemplatePreviewModal
        isOpen={Boolean(previewMeasurement || previewStitching)}
        onClose={() => {
          setPreviewMeasurement(null);
          setPreviewStitching(null);
        }}
        measurementTemplate={previewMeasurement}
        stitchingTemplate={previewStitching}
        onEdit={() => {
          if (previewMeasurement) {
            setMeasurementToEdit(previewMeasurement);
            setIsMeasurementModalOpen(true);
            setPreviewMeasurement(null);
          } else if (previewStitching) {
            setStitchingToEdit(previewStitching);
            setIsStitchingModalOpen(true);
            setPreviewStitching(null);
          }
        }}
        onDuplicate={() => {
          if (previewMeasurement) {
            handleDuplicate(previewMeasurement.id, 'measurement');
            setPreviewMeasurement(null);
          } else if (previewStitching) {
            handleDuplicate(previewStitching.id, 'stitching');
            setPreviewStitching(null);
          }
        }}
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

      {/* Confirm Delete Dialog */}
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
