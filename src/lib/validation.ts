import { z } from 'zod';

// Auth validation schemas
export const authSchema = {
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo')
};

export const loginSchema = z.object({
  email: authSchema.email,
  password: authSchema.password
});

export const signupSchema = z.object({
  email: authSchema.email,
  password: authSchema.password,
  name: authSchema.name
});

// Guest info validation schema
export const guestInfoSchema = z.object({
  guestName: z.string().trim().min(1, 'Nome do hóspede é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().trim().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'Nome da cidade muito longo').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Estado deve ter até 2 caracteres').optional().or(z.literal('')),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida').optional().or(z.literal('')),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido').optional().or(z.literal(''))
});

// Booking validation schema
export const bookingSchema = z.object({
  guestName: z.string().trim().min(1, 'Nome do hóspede é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().trim().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(20, 'Telefone muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'Nome da cidade muito longo').optional().or(z.literal('')),
  state: z.string().trim().max(2, 'Estado deve ter até 2 caracteres').optional().or(z.literal('')),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida').optional().or(z.literal('')),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'CPF inválido').optional().or(z.literal('')),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de check-in inválida'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de check-out inválida'),
  totalValue: z.number().min(0, 'Valor deve ser positivo'),
  paymentMethod: z.string().trim().min(1, 'Método de pagamento é obrigatório').max(50, 'Método de pagamento muito longo'),
  status: z.enum(['requested', 'pending', 'confirmed', 'checked_in', 'active', 'checked_out', 'completed', 'cancelled']),
  notes: z.string().max(1000, 'Notas muito longas').optional().or(z.literal(''))
});

// Property validation schema
export const propertySchema = z.object({
  name: z.string().trim().min(1, 'Nome da propriedade é obrigatório').max(100, 'Nome muito longo'),
  location: z.string().trim().min(1, 'Localização é obrigatória').max(200, 'Localização muito longa'),
  capacity: z.number().int().min(1, 'Capacidade deve ser pelo menos 1').max(50, 'Capacidade muito alta'),
  defaultDailyRate: z.number().min(0, 'Taxa diária deve ser positiva').optional(),
  fixedNotes: z.string().max(1000, 'Notas muito longas').optional().or(z.literal(''))
});

// Validation helper function
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d+\-\(\)\s]/g, '');
};

export const sanitizeCPF = (cpf: string): string => {
  return cpf.replace(/[^\d\.\-]/g, '');
};

// Helper validation functions for common use cases
export const validateEmail = (email: string) => {
  return validateData(z.object({ email: authSchema.email }), { email });
};

export const validateAuth = (email: string, password: string) => {
  return validateData(loginSchema, { email, password });
};

export const validateSignup = (email: string, password: string, name: string) => {
  return validateData(signupSchema, { email, password, name });
};