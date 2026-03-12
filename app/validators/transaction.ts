import vine from '@vinejs/vine'

export const createTransactionValidator = vine.create({
  amount: vine.number().withoutDecimals().min(1),
  name: vine.string().trim().minLength(1).maxLength(120),
  email: vine.string().trim().email().maxLength(254),
  cardNumber: vine
    .string()
    .trim()
    .fixedLength(16)
    .regex(/^\d{16}$/),
  cvv: vine
    .string()
    .trim()
    .fixedLength(3)
    .regex(/^\d{3}$/),
})
