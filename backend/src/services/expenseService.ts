import { prisma } from '../db.js';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Rent & Lease',
  'Electricity & Utilities',
  'Transport & Delivery',
  'Repairs & Maintenance',
  'Packaging & Miscellaneous',
  'Salaries & Tailor Wages',
  'Marketing & Promotions',
  'Boutique Amenities & Refreshments',
  'Other Operating Expenses',
] as const;

export interface CreateExpenseInput {
  category: string;
  title: string;
  amount: number;
  expense_date?: string | Date;
  payment_method?: string;
  vendor_id?: string | null;
  payee_name?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_by?: string;
}

export interface UpdateExpenseInput {
  category?: string;
  title?: string;
  amount?: number;
  expense_date?: string | Date;
  payment_method?: string;
  vendor_id?: string | null;
  payee_name?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}

export class ExpenseService {
  /**
   * Generates sequential expense number: EXP-YYYY-XXXX
   */
  static async generateExpenseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.operatingExpense.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `EXP-${year}-${seq}`;
  }

  /**
   * Returns list of configured expense categories
   */
  static getCategories(): string[] {
    return [...DEFAULT_EXPENSE_CATEGORIES];
  }

  /**
   * Lists operating expenses with filtering
   */
  static async listExpenses(params: {
    category?: string;
    payment_method?: string;
    status?: 'ACTIVE' | 'VOIDED' | 'ALL';
    vendor_id?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  } = {}) {
    const { category, payment_method, status = 'ACTIVE', vendor_id, start_date, end_date, search } = params;
    const where: any = {};

    if (status === 'ACTIVE') {
      where.status = 'ACTIVE';
    } else if (status === 'VOIDED') {
      where.status = 'VOIDED';
    }

    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (payment_method && payment_method !== 'ALL') {
      where.payment_method = payment_method;
    }

    if (vendor_id && vendor_id !== 'ALL') {
      where.vendor_id = vendor_id;
    }

    if (start_date || end_date) {
      where.expense_date = {};
      if (start_date) where.expense_date.gte = new Date(start_date);
      if (end_date) where.expense_date.lte = new Date(end_date);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { expense_number: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { payee_name: { contains: q, mode: 'insensitive' } },
        { reference_number: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.operatingExpense.findMany({
      where,
      include: {
        vendor: {
          select: { id: true, name: true, phone: true, city: true },
        },
      },
      orderBy: { expense_date: 'desc' },
    });
  }

  /**
   * Retrieves single operating expense
   */
  static async getExpense(id: string) {
    const expense = await prisma.operatingExpense.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });

    if (!expense) {
      throw new Error(`Operating expense not found with id ${id}`);
    }

    return expense;
  }

  /**
   * Alias for getExpense
   */
  static async getExpenseById(id: string) {
    return this.getExpense(id);
  }

  /**
   * Records a new operating expense
   */
  static async createExpense(input: CreateExpenseInput) {
    if (input.amount <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }

    const expenseNumber = await this.generateExpenseNumber();

    // If vendor_id is given, pull vendor name if payee_name not provided
    let payee = input.payee_name?.trim();
    if (!payee && input.vendor_id) {
      const vendor = await prisma.supplier.findUnique({ where: { id: input.vendor_id } });
      if (vendor) {
        payee = vendor.name;
      }
    }

    return prisma.operatingExpense.create({
      data: {
        expense_number: expenseNumber,
        category: input.category.trim(),
        title: input.title.trim(),
        amount: Number(input.amount),
        expense_date: input.expense_date ? new Date(input.expense_date) : new Date(),
        payment_method: input.payment_method || 'UPI',
        vendor_id: input.vendor_id || null,
        payee_name: payee || null,
        reference_number: input.reference_number?.trim() || null,
        receipt_url: input.receipt_url?.trim() || null,
        notes: input.notes?.trim() || null,
        status: 'ACTIVE',
        created_by: input.created_by || 'Staff',
      },
      include: {
        vendor: true,
      },
    });
  }

  /**
   * Updates an active operating expense
   */
  static async updateExpense(id: string, input: UpdateExpenseInput) {
    const existing = await prisma.operatingExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Expense record not found with id ${id}`);
    }

    if (existing.status === 'VOIDED') {
      throw new Error('Cannot update a voided expense record');
    }

    return prisma.operatingExpense.update({
      where: { id },
      data: {
        ...(input.category !== undefined && { category: input.category.trim() }),
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.amount !== undefined && { amount: Math.max(0.01, Number(input.amount)) }),
        ...(input.expense_date !== undefined && { expense_date: new Date(input.expense_date) }),
        ...(input.payment_method !== undefined && { payment_method: input.payment_method }),
        ...(input.vendor_id !== undefined && { vendor_id: input.vendor_id || null }),
        ...(input.payee_name !== undefined && { payee_name: input.payee_name?.trim() || null }),
        ...(input.reference_number !== undefined && { reference_number: input.reference_number?.trim() || null }),
        ...(input.receipt_url !== undefined && { receipt_url: input.receipt_url?.trim() || null }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      },
      include: {
        vendor: true,
      },
    });
  }

  /**
   * Voids an operating expense with audit reason
   */
  static async voidExpense(id: string, reason: string, voidedBy?: string) {
    const existing = await prisma.operatingExpense.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Expense record not found with id ${id}`);
    }

    if (existing.status === 'VOIDED') {
      throw new Error('Expense is already voided');
    }

    return prisma.operatingExpense.update({
      where: { id },
      data: {
        status: 'VOIDED',
        void_reason: reason.trim(),
        voided_at: new Date(),
        voided_by: voidedBy || 'Staff',
      },
    });
  }
}
