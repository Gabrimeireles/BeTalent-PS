import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(120)
const amount = () => vine.number().withoutDecimals().min(1)

export const createProductValidator = vine.create({
  name: name(),
  amount: amount(),
})

export const updateProductValidator = vine.create({
  name: name().optional(),
  amount: amount().optional(),
})
