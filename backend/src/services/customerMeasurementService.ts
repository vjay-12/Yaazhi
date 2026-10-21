import { prisma } from '../db.js';

export interface MeasurementValueInput {
  field_id: string;
  field_key?: string;
  field_name?: string;
  numeric_value?: number | string | null;
  num_value?: number | string | null;
  text_value?: string | null;
  unit?: 'in' | 'cm' | string;
  notes?: string | null;
}

export interface CreateProfileInput {
  template_id: string;
  profile_name: string;
  garment_type?: string | null;
  notes?: string | null;
  fitting_preferences?: string | null;
  tailor_instructions?: string | null;
  order_id?: string | null;
  measured_by?: string | null;
  measured_at?: string | Date;
  values: MeasurementValueInput[];
}

export interface AddVersionInput {
  notes?: string | null;
  fitting_preferences?: string | null;
  tailor_instructions?: string | null;
  order_id?: string | null;
  measured_by?: string | null;
  measured_at?: string | Date;
  values: MeasurementValueInput[];
}

export interface UpdateProfileInput {
  profile_name?: string;
  garment_type?: string;
  notes?: string | null;
  fitting_preferences?: string | null;
  tailor_instructions?: string | null;
  measured_by?: string | null;
  order_id?: string | null;
  values?: MeasurementValueInput[];
}

export interface ProfileFilterOptions {
  garment_type?: string;
  search?: string;
}

export class CustomerMeasurementService {
  /**
   * Helper to resolve field metadata: uses active field or falls back to saved snapshot.
   */
  private static resolveFieldFromSnapshot(
    field: any | null,
    fieldId: string,
    fieldSnapshots: any[] | null
  ) {
    if (field) {
      return {
        field_key: field.field_key,
        field_name: field.field_name,
        field_type: field.field_type || 'number',
        default_unit: field.default_unit || 'in',
        display_order: field.display_order || 0,
        options: field.options ? (typeof field.options === 'string' ? JSON.parse(field.options) : field.options) : null,
        validation_rules: field.validation_rules ? (typeof field.validation_rules === 'string' ? JSON.parse(field.validation_rules) : field.validation_rules) : null,
      };
    }

    if (fieldSnapshots && Array.isArray(fieldSnapshots)) {
      const snap = fieldSnapshots.find((s) => s.id === fieldId || s.field_key === fieldId);
      if (snap) {
        return {
          field_key: snap.field_key,
          field_name: snap.field_name,
          field_type: snap.field_type || 'number',
          default_unit: snap.default_unit || 'in',
          display_order: snap.display_order || 0,
          options: snap.options ? (typeof snap.options === 'string' ? JSON.parse(snap.options) : snap.options) : null,
          validation_rules: snap.validation_rules ? (typeof snap.validation_rules === 'string' ? JSON.parse(snap.validation_rules) : snap.validation_rules) : null,
        };
      }
    }

    return {
      field_key: 'custom_param',
      field_name: 'Custom Parameter',
      field_type: 'number',
      default_unit: 'in',
      display_order: 999,
      options: null,
      validation_rules: null,
    };
  }

  static async getProfilesByCustomer(customerId: string, filters?: ProfileFilterOptions) {
    const whereClause: any = {
      customer_id: customerId,
      is_active: true,
    };

    if (filters?.garment_type && filters.garment_type !== 'ALL') {
      whereClause.OR = [
        { garment_type: { equals: filters.garment_type, mode: 'insensitive' } },
        { template: { garment_type: { equals: filters.garment_type, mode: 'insensitive' } } },
      ];
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      whereClause.AND = [
        {
          OR: [
            { profile_name: { contains: q, mode: 'insensitive' } },
            { notes: { contains: q, mode: 'insensitive' } },
            { garment_type: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const profiles = await prisma.customerMeasurementProfile.findMany({
      where: whereClause,
      include: {
        template: {
          include: {
            fields: {
              where: { is_active: true },
              orderBy: { display_order: 'asc' },
            },
          },
        },
        versions: {
          where: { is_current: true },
          include: {
            order: {
              select: { id: true, order_number: true, grand_total: true, order_date: true },
            },
            values: {
              include: {
                field: true,
              },
            },
          },
          take: 1,
        },
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return profiles.map((p) => {
      const currentVer = p.versions[0] || null;
      let fieldSnapshots: any[] | null = null;
      if (currentVer?.field_snapshots) {
        try {
          fieldSnapshots = JSON.parse(currentVer.field_snapshots);
        } catch {
          fieldSnapshots = null;
        }
      }

      return {
        id: p.id,
        customer_id: p.customer_id,
        template_id: p.template_id,
        template_name: p.template?.name || 'Garment Template',
        template_code: p.template?.code || 'CUSTOM',
        garment_type: p.garment_type || p.template?.garment_type || 'Blouse',
        profile_name: p.profile_name,
        notes: p.notes,
        is_active: p.is_active,
        total_versions: p._count.versions,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
        template_fields: p.template?.fields || [],
        current_version: currentVer
          ? {
              id: currentVer.id,
              profile_id: currentVer.profile_id,
              version_number: currentVer.version_number,
              measured_at: currentVer.measured_at.toISOString(),
              measured_by: currentVer.measured_by,
              notes: currentVer.notes,
              fitting_preferences: currentVer.fitting_preferences,
              tailor_instructions: currentVer.tailor_instructions,
              order_id: currentVer.order_id,
              order_number: currentVer.order?.order_number || null,
              is_current: currentVer.is_current,
              created_at: currentVer.created_at.toISOString(),
              field_snapshots: fieldSnapshots,
              values: currentVer.values
                .map((v) => {
                  const meta = this.resolveFieldFromSnapshot(v.field, v.field_id, fieldSnapshots);
                  const numVal =
                    v.numeric_value !== null && v.numeric_value !== undefined
                      ? Number(v.numeric_value)
                      : null;
                  return {
                    id: v.id,
                    field_id: v.field_id,
                    field_key: meta.field_key,
                    field_name: meta.field_name,
                    field_type: meta.field_type,
                    numeric_value: numVal,
                    num_value: numVal,
                    text_value: v.text_value,
                    unit: (v.unit as 'in' | 'cm') || meta.default_unit || 'in',
                    notes: v.notes,
                    display_order: meta.display_order,
                    options: meta.options,
                    validation_rules: meta.validation_rules,
                  };
                })
                .sort((a, b) => a.display_order - b.display_order),
            }
          : null,
      };
    });
  }

  static async getProfileDetails(customerId: string, profileId: string) {
    const profile = await prisma.customerMeasurementProfile.findFirst({
      where: {
        id: profileId,
        customer_id: customerId,
        is_active: true,
      },
      include: {
        template: {
          include: {
            fields: {
              where: { is_active: true },
              orderBy: { display_order: 'asc' },
            },
          },
        },
        versions: {
          where: { is_current: true },
          include: {
            order: {
              select: { id: true, order_number: true, grand_total: true, order_date: true },
            },
            values: {
              include: {
                field: true,
              },
            },
          },
          take: 1,
        },
        _count: {
          select: { versions: true },
        },
      },
    });

    if (!profile) return null;

    const currentVer = profile.versions[0] || null;
    let fieldSnapshots: any[] | null = null;
    if (currentVer?.field_snapshots) {
      try {
        fieldSnapshots = JSON.parse(currentVer.field_snapshots);
      } catch {
        fieldSnapshots = null;
      }
    }

    return {
      id: profile.id,
      customer_id: profile.customer_id,
      template_id: profile.template_id,
      template_name: profile.template?.name || 'Garment Template',
      template_code: profile.template?.code || 'CUSTOM',
      garment_type: profile.garment_type || profile.template?.garment_type || 'Blouse',
      profile_name: profile.profile_name,
      notes: profile.notes,
      is_active: profile.is_active,
      total_versions: profile._count.versions,
      created_at: profile.created_at.toISOString(),
      updated_at: profile.updated_at.toISOString(),
      template_fields: profile.template?.fields || [],
      current_version: currentVer
        ? {
            id: currentVer.id,
            profile_id: currentVer.profile_id,
            version_number: currentVer.version_number,
            measured_at: currentVer.measured_at.toISOString(),
            measured_by: currentVer.measured_by,
            notes: currentVer.notes,
            fitting_preferences: currentVer.fitting_preferences,
            tailor_instructions: currentVer.tailor_instructions,
            order_id: currentVer.order_id,
            order_number: currentVer.order?.order_number || null,
            is_current: currentVer.is_current,
            created_at: currentVer.created_at.toISOString(),
            field_snapshots: fieldSnapshots,
            values: currentVer.values
              .map((v) => {
                const meta = this.resolveFieldFromSnapshot(v.field, v.field_id, fieldSnapshots);
                const numVal =
                  v.numeric_value !== null && v.numeric_value !== undefined
                    ? Number(v.numeric_value)
                    : null;
                return {
                  id: v.id,
                  field_id: v.field_id,
                  field_key: meta.field_key,
                  field_name: meta.field_name,
                  field_type: meta.field_type,
                  numeric_value: numVal,
                  num_value: numVal,
                  text_value: v.text_value,
                  unit: (v.unit as 'in' | 'cm') || meta.default_unit || 'in',
                  notes: v.notes,
                  display_order: meta.display_order,
                  options: meta.options,
                  validation_rules: meta.validation_rules,
                };
              })
              .sort((a, b) => a.display_order - b.display_order),
          }
        : null,
    };
  }

  static async getProfileHistory(customerId: string, profileId: string) {
    const profile = await prisma.customerMeasurementProfile.findFirst({
      where: {
        id: profileId,
        customer_id: customerId,
      },
      include: {
        template: true,
        versions: {
          orderBy: { version_number: 'desc' },
          include: {
            order: {
              select: { id: true, order_number: true, grand_total: true, order_date: true },
            },
            values: {
              include: { field: true },
            },
          },
        },
      },
    });

    if (!profile) return null;

    return {
      profile_id: profile.id,
      profile_name: profile.profile_name,
      template_name: profile.template?.name,
      garment_type: profile.garment_type || profile.template?.garment_type || 'Blouse',
      customer_id: profile.customer_id,
      versions: profile.versions.map((v) => {
        let fieldSnapshots: any[] | null = null;
        if (v.field_snapshots) {
          try {
            fieldSnapshots = JSON.parse(v.field_snapshots);
          } catch {
            fieldSnapshots = null;
          }
        }

        return {
          id: v.id,
          version_number: v.version_number,
          measured_at: v.measured_at.toISOString(),
          measured_by: v.measured_by,
          notes: v.notes,
          fitting_preferences: v.fitting_preferences,
          tailor_instructions: v.tailor_instructions,
          order_id: v.order_id,
          order_number: v.order?.order_number || null,
          is_current: v.is_current,
          created_at: v.created_at.toISOString(),
          field_snapshots: fieldSnapshots,
          values: v.values
            .map((val) => {
              const meta = this.resolveFieldFromSnapshot(val.field, val.field_id, fieldSnapshots);
              const numVal =
                val.numeric_value !== null && val.numeric_value !== undefined
                  ? Number(val.numeric_value)
                  : null;
              return {
                id: val.id,
                field_id: val.field_id,
                field_key: meta.field_key,
                field_name: meta.field_name,
                field_type: meta.field_type,
                numeric_value: numVal,
                num_value: numVal,
                text_value: val.text_value,
                unit: (val.unit as 'in' | 'cm') || meta.default_unit || 'in',
                notes: val.notes,
                display_order: meta.display_order,
                options: meta.options,
                validation_rules: meta.validation_rules,
              };
            })
            .sort((a, b) => a.display_order - b.display_order),
        };
      }),
    };
  }

  static async createProfile(customerId: string, input: CreateProfileInput) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const template = await prisma.measurementTemplate.findUnique({
      where: { id: input.template_id },
      include: {
        fields: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
    });
    if (!template) throw new Error('Measurement template not found');
    if (!template.is_active || template.is_archived) {
      throw new Error('Selected measurement template is archived or inactive and cannot be used for new records');
    }

    // Validate values against template field definitions
    for (const f of template.fields) {
      const val = (input.values || []).find(
        (v) => v.field_id === f.id || v.field_key === f.field_key
      );

      const rawVal =
        val?.numeric_value !== undefined && val?.numeric_value !== null
          ? val.numeric_value
          : (val as any)?.num_value !== undefined && (val as any)?.num_value !== null
          ? (val as any).num_value
          : val?.text_value;

      const hasValue = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';

      if (f.is_required && !hasValue) {
        throw new Error(`Missing required measurement: "${f.field_name}" is required.`);
      }

      if (hasValue && f.field_type === 'number') {
        const num = Number(rawVal);
        if (isNaN(num)) {
          throw new Error(`Invalid numeric measurement for "${f.field_name}": "${rawVal}"`);
        }

        if (f.validation_rules) {
          try {
            const rules = typeof f.validation_rules === 'string' ? JSON.parse(f.validation_rules) : f.validation_rules;
            if (rules && rules.min !== undefined && rules.min !== null && num < Number(rules.min)) {
              throw new Error(`Measurement "${f.field_name}" must be between ${rules.min} and ${rules.max ?? 'any'} ${val?.unit || f.default_unit}`);
            }
            if (rules && rules.max !== undefined && rules.max !== null && num > Number(rules.max)) {
              throw new Error(`Measurement "${f.field_name}" must be between ${rules.min ?? 0} and ${rules.max} ${val?.unit || f.default_unit}`);
            }
          } catch (e: any) {
            if (e.message.includes('must be between')) throw e;
          }
        }
      }
    }

    const measuredDate = input.measured_at ? new Date(input.measured_at) : new Date();
    const resolvedGarmentType = input.garment_type?.trim() || template.garment_type || 'Blouse';

    // Serialize snapshot of template fields for historical preservation
    const fieldSnapshots = JSON.stringify(
      template.fields.map((f) => ({
        id: f.id,
        field_key: f.field_key,
        field_name: f.field_name,
        field_type: f.field_type,
        default_unit: f.default_unit,
        display_order: f.display_order,
        is_required: f.is_required,
        options: f.options,
        validation_rules: f.validation_rules,
      }))
    );

    const created = await prisma.$transaction(async (tx) => {
      // 1. Create Profile
      const profile = await tx.customerMeasurementProfile.create({
        data: {
          customer_id: customerId,
          template_id: input.template_id,
          profile_name: input.profile_name.trim() || `${resolvedGarmentType} Profile`,
          garment_type: resolvedGarmentType,
          notes: input.notes ? input.notes.trim() : null,
          is_active: true,
        },
      });

      // 2. Create Initial Version (v1)
      const version = await tx.customerMeasurementVersion.create({
        data: {
          profile_id: profile.id,
          version_number: 1,
          measured_at: measuredDate,
          measured_by: input.measured_by ? input.measured_by.trim() : null,
          notes: input.notes ? input.notes.trim() : null,
          fitting_preferences: input.fitting_preferences ? input.fitting_preferences.trim() : null,
          tailor_instructions: input.tailor_instructions ? input.tailor_instructions.trim() : null,
          order_id: input.order_id || null,
          field_snapshots: fieldSnapshots,
          is_current: true,
        },
      });

      // 3. Insert Measurement Values
      if (input.values && input.values.length > 0) {
        await tx.customerMeasurementValue.createMany({
          data: input.values.map((v) => {
            const rawVal =
              v.numeric_value !== undefined && v.numeric_value !== null
                ? v.numeric_value
                : (v as any).num_value !== undefined && (v as any).num_value !== null
                ? (v as any).num_value
                : null;
            const parsed =
              rawVal !== null && rawVal !== undefined && rawVal !== ''
                ? Number(rawVal)
                : null;
            const cleanNum = parsed !== null && !isNaN(parsed) ? parsed : null;

            return {
              version_id: version.id,
              field_id: v.field_id,
              numeric_value: cleanNum,
              text_value: v.text_value || null,
              unit: v.unit || 'in',
              notes: v.notes || null,
            };
          }),
        });
      }

      return profile;
    });

    return this.getProfileDetails(customerId, created.id);
  }

  static async addProfileVersion(customerId: string, profileId: string, input: AddVersionInput) {
    const profile = await prisma.customerMeasurementProfile.findFirst({
      where: { id: profileId, customer_id: customerId },
      include: {
        template: {
          include: {
            fields: {
              where: { is_active: true },
              orderBy: { display_order: 'asc' },
            },
          },
        },
        versions: { orderBy: { version_number: 'desc' }, take: 1 },
      },
    });
    if (!profile) throw new Error('Customer measurement profile not found');

    const nextVerNumber = (profile.versions[0]?.version_number || 0) + 1;
    const measuredDate = input.measured_at ? new Date(input.measured_at) : new Date();

    // Snapshot current template fields or carry over previous snapshot if template was archived
    let fieldSnapshots = profile.versions[0]?.field_snapshots || null;
    if (profile.template?.fields?.length) {
      fieldSnapshots = JSON.stringify(
        profile.template.fields.map((f) => ({
          id: f.id,
          field_key: f.field_key,
          field_name: f.field_name,
          field_type: f.field_type,
          default_unit: f.default_unit,
          display_order: f.display_order,
          is_required: f.is_required,
          options: f.options,
          validation_rules: f.validation_rules,
        }))
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark existing versions as not current
      await tx.customerMeasurementVersion.updateMany({
        where: { profile_id: profileId, is_current: true },
        data: { is_current: false },
      });

      // 2. Create new version
      const newVersion = await tx.customerMeasurementVersion.create({
        data: {
          profile_id: profileId,
          version_number: nextVerNumber,
          measured_at: measuredDate,
          measured_by: input.measured_by ? input.measured_by.trim() : null,
          notes: input.notes ? input.notes.trim() : null,
          fitting_preferences: input.fitting_preferences ? input.fitting_preferences.trim() : null,
          tailor_instructions: input.tailor_instructions ? input.tailor_instructions.trim() : null,
          order_id: input.order_id || null,
          field_snapshots: fieldSnapshots,
          is_current: true,
        },
      });

      // 3. Save new values
      if (input.values && input.values.length > 0) {
        await tx.customerMeasurementValue.createMany({
          data: input.values.map((v) => {
            const rawVal =
              v.numeric_value !== undefined && v.numeric_value !== null
                ? v.numeric_value
                : (v as any).num_value !== undefined && (v as any).num_value !== null
                ? (v as any).num_value
                : null;
            const parsed =
              rawVal !== null && rawVal !== undefined && rawVal !== ''
                ? Number(rawVal)
                : null;
            const cleanNum = parsed !== null && !isNaN(parsed) ? parsed : null;

            return {
              version_id: newVersion.id,
              field_id: v.field_id,
              numeric_value: cleanNum,
              text_value: v.text_value || null,
              unit: v.unit || 'in',
              notes: v.notes || null,
            };
          }),
        });
      }

      // 4. Update profile updated_at timestamp
      await tx.customerMeasurementProfile.update({
        where: { id: profileId },
        data: { updated_at: new Date() },
      });

      return newVersion;
    });
  }

  static async cloneProfile(customerId: string, profileId: string, customName?: string) {
    const existing = await this.getProfileDetails(customerId, profileId);
    if (!existing) throw new Error('Measurement profile to clone not found');

    const newName = customName && customName.trim()
      ? customName.trim()
      : `${existing.profile_name} (Copy)`;

    const curVer = existing.current_version;
    const valuesToCopy: MeasurementValueInput[] = (curVer?.values || []).map((v) => ({
      field_id: v.field_id,
      numeric_value: v.numeric_value,
      text_value: v.text_value,
      unit: v.unit,
      notes: v.notes,
    }));

    return this.createProfile(customerId, {
      template_id: existing.template_id,
      profile_name: newName,
      garment_type: existing.garment_type,
      notes: existing.notes ? `Cloned from ${existing.profile_name}. ${existing.notes}` : `Cloned from ${existing.profile_name}`,
      fitting_preferences: curVer?.fitting_preferences || null,
      tailor_instructions: curVer?.tailor_instructions || null,
      measured_by: curVer?.measured_by || null,
      values: valuesToCopy,
    });
  }

  static async updateProfile(customerId: string, profileId: string, data: UpdateProfileInput) {
    const profile = await prisma.customerMeasurementProfile.findFirst({
      where: { id: profileId, customer_id: customerId },
      include: {
        versions: {
          where: { is_current: true },
          take: 1,
        },
      },
    });

    if (!profile) throw new Error('Measurement profile not found');

    return prisma.$transaction(async (tx) => {
      // 1. Update Profile meta
      const updatedProfile = await tx.customerMeasurementProfile.update({
        where: { id: profileId },
        data: {
          ...(data.profile_name ? { profile_name: data.profile_name.trim() } : {}),
          ...(data.garment_type ? { garment_type: data.garment_type.trim() } : {}),
          ...(data.notes !== undefined ? { notes: data.notes ? data.notes.trim() : null } : {}),
          updated_at: new Date(),
        },
      });

      // 2. If current version exists and version fields are provided, update current version
      const currentVer = profile.versions[0];
      if (currentVer) {
        const verUpdateData: any = {};
        if (data.fitting_preferences !== undefined) {
          verUpdateData.fitting_preferences = data.fitting_preferences ? data.fitting_preferences.trim() : null;
        }
        if (data.tailor_instructions !== undefined) {
          verUpdateData.tailor_instructions = data.tailor_instructions ? data.tailor_instructions.trim() : null;
        }
        if (data.measured_by !== undefined) {
          verUpdateData.measured_by = data.measured_by ? data.measured_by.trim() : null;
        }
        if (data.order_id !== undefined) {
          verUpdateData.order_id = data.order_id || null;
        }
        if (data.notes !== undefined) {
          verUpdateData.notes = data.notes ? data.notes.trim() : null;
        }

        if (Object.keys(verUpdateData).length > 0) {
          await tx.customerMeasurementVersion.update({
            where: { id: currentVer.id },
            data: verUpdateData,
          });
        }

        // If new values were supplied, update or upsert them for this current version
        if (data.values && Array.isArray(data.values)) {
          for (const v of data.values) {
            const rawVal =
              v.numeric_value !== undefined && v.numeric_value !== null
                ? v.numeric_value
                : (v as any).num_value !== undefined && (v as any).num_value !== null
                ? (v as any).num_value
                : null;
            const parsed =
              rawVal !== null && rawVal !== undefined && rawVal !== ''
                ? Number(rawVal)
                : null;
            const cleanNum = parsed !== null && !isNaN(parsed) ? parsed : null;

            await tx.customerMeasurementValue.upsert({
              where: {
                version_id_field_id: {
                  version_id: currentVer.id,
                  field_id: v.field_id,
                },
              },
              create: {
                version_id: currentVer.id,
                field_id: v.field_id,
                numeric_value: cleanNum,
                text_value: v.text_value || null,
                unit: v.unit || 'in',
                notes: v.notes || null,
              },
              update: {
                numeric_value: cleanNum,
                text_value: v.text_value || null,
                unit: v.unit || 'in',
                notes: v.notes || null,
              },
            });
          }
        }
      }

      return updatedProfile;
    });
  }

  static async linkOrderToProfileVersion(customerId: string, profileId: string, orderId: string, versionId?: string) {
    const profile = await prisma.customerMeasurementProfile.findFirst({
      where: { id: profileId, customer_id: customerId },
      include: {
        versions: {
          where: versionId ? { id: versionId } : { is_current: true },
          take: 1,
        },
      },
    });

    if (!profile || profile.versions.length === 0) {
      throw new Error('Measurement version not found for linking');
    }

    const ver = profile.versions[0];
    return prisma.customerMeasurementVersion.update({
      where: { id: ver.id },
      data: { order_id: orderId },
    });
  }

  static async deleteProfile(customerId: string, profileId: string) {
    // Check if referenced by any orders
    const referencedVersion = await prisma.customerMeasurementVersion.findFirst({
      where: {
        profile_id: profileId,
        order_id: { not: null },
      },
      include: { order: true },
    });

    if (referencedVersion) {
      throw new Error(
        `Cannot delete measurement profile: referenced by sales order ${
          referencedVersion.order?.order_number || referencedVersion.order_id
        }. Archive the customer or record instead.`
      );
    }

    return prisma.customerMeasurementProfile.update({
      where: { id: profileId, customer_id: customerId },
      data: { is_active: false },
    });
  }
}

export const customerMeasurementService = CustomerMeasurementService;
