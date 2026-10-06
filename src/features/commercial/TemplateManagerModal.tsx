import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type MeasurementTemplate,
  type MeasurementTemplateField,
} from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { CustomDropdown } from '../../components/common/CustomDropdown';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesUpdated?: () => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  onTemplatesUpdated,
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);

  // New Template form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('WOMEN');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // New Field form state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'number' | 'text'>('number');
  const [newFieldUnit, setNewFieldUnit] = useState<'in' | 'cm'>('in');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [isSavingField, setIsSavingField] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await customerService.getTemplates();
      setTemplates(data || []);
      if (data && data.length > 0) {
        setSelectedTemplateId((prev) => {
          if (prev && data.some((t) => t.id === prev)) {
            return prev;
          }
          return data[0].id;
        });
      }
    } catch (err: any) {
      console.error('Failed to load measurement templates:', err);
      showToast({
        type: 'error',
        title: 'Load Error',
        message: 'Could not fetch measurement templates',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    try {
      setIsSavingTemplate(true);
      const created = await customerService.createTemplate({
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        description: newTemplateDescription.trim() || undefined,
        fields: [],
      });

      showToast({
        type: 'success',
        title: 'Template Created',
        message: `Created "${created.name}" tailoring template`,
      });

      setIsCreatingTemplate(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      await fetchTemplates();
      if (created?.id) {
        setSelectedTemplateId(created.id);
      }
      onTemplatesUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Template Error',
        message: err.message || 'Failed to create template',
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !newFieldName.trim()) return;

    try {
      setIsSavingField(true);
      await customerService.addTemplateField(selectedTemplateId, {
        field_name: newFieldName.trim(),
        field_type: newFieldType,
        default_unit: newFieldUnit,
        is_required: newFieldRequired,
      });

      showToast({
        type: 'success',
        title: 'Field Added',
        message: `Added "${newFieldName}" to template`,
      });

      setIsAddingField(false);
      setNewFieldName('');
      setNewFieldRequired(false);
      await fetchTemplates();
      onTemplatesUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Field Error',
        message: err.message || 'Failed to add field',
      });
    } finally {
      setIsSavingField(false);
    }
  };

  const handleRemoveField = async (field: MeasurementTemplateField) => {
    if (!selectedTemplateId) return;
    try {
      await customerService.removeTemplateField(selectedTemplateId, field.id);
      showToast({
        type: 'info',
        title: 'Field Removed',
        message: `Archived ${field.field_name}`,
      });
      await fetchTemplates();
      onTemplatesUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Removal Error',
        message: err.message || 'Could not remove field',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Boutique Measurement Templates"
      subtitle="Manage garment measurement parameters, tailoring specifications, and custom fields"
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--yz-text-muted)' }}>
            <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <span>Loading garment templates...</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px', minHeight: '380px' }}>
            {/* Left Column: Template Selector List */}
            <div
              style={{
                borderRight: '1px solid var(--yz-border)',
                paddingRight: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--yz-text-secondary)',
                  }}
                >
                  Garment Templates
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: 'var(--yz-bg-subtle)',
                    padding: '1px 6px',
                    borderRadius: 'var(--yz-radius-sm)',
                    color: 'var(--yz-text-muted)',
                  }}
                >
                  {templates.length}
                </span>
              </div>

              {/* Template Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '320px' }}>
                {templates.map((tmpl) => {
                  const isSelected = tmpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setIsCreatingTemplate(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '8px 10px',
                        borderRadius: 'var(--yz-radius-sm)',
                        border: isSelected ? '1px solid var(--yz-primary, #832729)' : '1px solid var(--yz-border)',
                        backgroundColor: isSelected ? '#FEF2F2' : 'var(--yz-bg-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                          }}
                        >
                          {tmpl.name}
                        </span>
                        {tmpl.is_default && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              color: 'var(--yz-primary, #832729)',
                              backgroundColor: '#FDE8E8',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                        {tmpl.fields?.length || 0} fields • {tmpl.category}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--yz-border)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={() => setIsCreatingTemplate(true)}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
                >
                  New Template
                </Button>
              </div>
            </div>

            {/* Right Column: Template Fields or Create Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isCreatingTemplate ? (
                /* Create Template Form */
                <form
                  onSubmit={handleCreateTemplate}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: 'var(--yz-bg-subtle)',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                      Create Custom Garment Template
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTemplate(false)}
                      style={{ fontSize: '11px', color: 'var(--yz-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="yz-label">Template Name *</label>
                    <input
                      type="text"
                      className="yz-input"
                      required
                      placeholder="e.g. Designer Lehenga, Indo-Western Sherwani"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="yz-label">Category</label>
                      <CustomDropdown
                        value={newTemplateCategory}
                        onChange={(val) => setNewTemplateCategory(String(val))}
                        options={[
                          { value: 'WOMEN', label: "Women's Boutique" },
                          { value: 'MEN', label: "Men's Tailoring" },
                          { value: 'UNISEX', label: 'Unisex Garment' },
                          { value: 'KIDS', label: 'Kids Ethnic' },
                          { value: 'CUSTOM', label: 'Custom Atelier' },
                        ]}
                        minWidth="100%"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label className="yz-label">Description (Optional)</label>
                      <input
                        type="text"
                        className="yz-input"
                        placeholder="e.g. Bridal flare & can-can tailoring"
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreatingTemplate(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isSavingTemplate}>
                      {isSavingTemplate ? 'Creating...' : 'Save Template'}
                    </Button>
                  </div>
                </form>
              ) : selectedTemplate ? (
                /* Selected Template Details & Fields */
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                          {selectedTemplate.name}
                        </span>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 'var(--yz-radius-sm)',
                            backgroundColor: '#E2E8F0',
                            color: '#475569',
                            fontFamily: 'var(--yz-font-mono)',
                          }}
                        >
                          {selectedTemplate.code}
                        </span>
                      </div>
                      {selectedTemplate.description && (
                        <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                          {selectedTemplate.description}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={12} />}
                      onClick={() => setIsAddingField(!isAddingField)}
                      style={{ fontSize: '11px' }}
                    >
                      {isAddingField ? 'Cancel' : '+ Add Field'}
                    </Button>
                  </div>

                  {/* Add Field Inline Form */}
                  {isAddingField && (
                    <form
                      onSubmit={handleAddField}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: 'var(--yz-radius-sm)',
                      }}
                    >
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#991B1B' }}>
                        Add New Measurement Field to {selectedTemplate.name}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <label className="yz-label">Field Name *</label>
                          <input
                            type="text"
                            className="yz-input"
                            required
                            autoFocus
                            placeholder="e.g. Cross Back, High Waist"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="yz-label">Type</label>
                          <CustomDropdown
                            value={newFieldType}
                            onChange={(val) => setNewFieldType(val as any)}
                            options={[
                              { value: 'number', label: 'Numeric (in/cm)' },
                              { value: 'text', label: 'Text / Notes' },
                            ]}
                            minWidth="100%"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label className="yz-label">Default Unit</label>
                          <CustomDropdown
                            value={newFieldUnit}
                            onChange={(val) => setNewFieldUnit(val as any)}
                            options={[
                              { value: 'in', label: 'Inches (in)' },
                              { value: 'cm', label: 'Centimeters (cm)' },
                            ]}
                            minWidth="100%"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newFieldRequired}
                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                            style={{ accentColor: 'var(--yz-primary, #832729)' }}
                          />
                          <span>Required Field for Tailor</span>
                        </label>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddingField(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" size="sm" type="submit" disabled={isSavingField}>
                            {isSavingField ? 'Adding...' : 'Save Field'}
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Fields Table */}
                  <div
                    className="yz-table-container"
                    style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--yz-border)' }}
                  >
                    <table className="yz-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '35px', textAlign: 'center' }}>#</th>
                          <th>FIELD NAME</th>
                          <th style={{ width: '90px' }}>KEY</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>TYPE</th>
                          <th style={{ width: '60px', textAlign: 'center' }}>UNIT</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>REQUIRED</th>
                          <th style={{ width: '40px', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedTemplate.fields || selectedTemplate.fields.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--yz-text-muted)' }}>
                              No measurement fields defined yet. Click "+ Add Field" to add one.
                            </td>
                          </tr>
                        ) : (
                          selectedTemplate.fields.map((f, idx) => (
                            <tr key={f.id || idx}>
                              <td style={{ textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '10.5px' }}>
                                {f.display_order || idx + 1}
                              </td>
                              <td style={{ fontWeight: 600, fontSize: '11.5px' }}>
                                {f.field_name}
                              </td>
                              <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                                {f.field_key}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--yz-text-secondary)' }}>
                                {f.field_type}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontSize: '10.5px' }}>
                                {f.default_unit || 'in'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {f.is_required ? (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      fontSize: '9.5px',
                                      fontWeight: 600,
                                      backgroundColor: '#FDE8E8',
                                      color: '#991B1B',
                                    }}
                                  >
                                    Required
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>Optional</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(f)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--yz-text-muted)',
                                    padding: '2px',
                                  }}
                                  title="Archive Field"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--yz-border)', paddingTop: '8px' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
