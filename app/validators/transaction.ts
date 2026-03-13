import vine from '@vinejs/vine'

export const createTransactionValidator = vine.create({
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
  products: vine
    .array(
      vine.object({
        productId: vine.number().withoutDecimals().positive(),
        quantity: vine.number().withoutDecimals().min(1),
      })
    )
    .minLength(1),
})
