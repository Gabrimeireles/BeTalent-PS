import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(1).maxLength(120)
const amount = () => vine.number().withoutDecimals().min(1)
const quantity = () => vine.number().withoutDecimals().min(0)

export const createProductValidator = vine.create({
  name: name(),
  amount: amount(),
  quantity: quantity(),
})

export const updateProductValidator = vine.create({
  name: name().optional(),
  amount: amount().optional(),
  quantity: quantity().optional(),
})
