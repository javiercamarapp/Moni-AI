import { z } from 'zod';

// Transaction validation schemas
export const TransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo').max(999999.99, 'El monto excede el límite permitido'),
  description: z.string().trim().min(1, 'La descripción no puede estar vacía').max(200, 'La descripción es demasiado larga'),
  payment_method: z.enum(['debito', 'credito', 'efectivo', 'transferencia'], {
    errorMap: () => ({ message: 'Método de pago inválido' })
  }),
  account: z.string().trim().min(1, 'Debes seleccionar una cuenta').max(100, 'Nombre de cuenta muy largo'),
  category_id: z.string().uuid('Categoría inválida').optional().nullable(),
  frequency: z.enum(['unico', 'diario', 'semanal', 'quincenal', 'mensual', 'anual'], {
    errorMap: () => ({ message: 'Frecuencia inválida' })
  }),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  type: z.enum(['ingreso', 'gasto'], {
    errorMap: () => ({ message: 'Tipo de transacción inválido' })
  })
});

// AI response validation schemas
export const AICategorySchema = z.object({
  category: z.string().trim().min(1).max(50, 'Nombre de categoría muy largo'),
  confidence: z.enum(['high', 'medium', 'low']),
  reason: z.string().max(200, 'Explicación muy larga')
});

export const AITransactionSchema = z.object({
  type: z.enum(['ingreso', 'gasto']),
  amount: z.number().positive().max(999999.99),
  description: z.string().trim().min(1).max(200),
  category: z.string().trim().max(50),
  confidence: z.enum(['high', 'medium', 'low'])
});

// WhatsApp message validation
export const WhatsAppMessageSchema = z.object({
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de teléfono inválido'),
  message_text: z.string().trim().min(1).max(1000, 'Mensaje demasiado largo')
});

// Helper function to sanitize strings
export function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength);
}

// Helper function to validate UUIDs
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
