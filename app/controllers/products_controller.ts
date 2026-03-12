import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'
import { createProductValidator, updateProductValidator } from '#validators/product'

export default class ProductsController {
  async index({ response }: HttpContext) {
    const products = await Product.query().orderBy('id', 'asc')

    return response.ok({
      data: products.map((product) => ({
        id: product.id,
        name: product.name,
        amount: product.amount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
    })
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createProductValidator)

    const product = await Product.create({
      name: payload.name,
      amount: payload.amount,
    })

    return response.created({
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  }

  async show({ params, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    return response.ok({
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  }

  async update({ params, request, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    const payload = await request.validateUsing(updateProductValidator)
    product.merge(payload)
    await product.save()

    return response.ok({
      data: {
        id: product.id,
        name: product.name,
        amount: product.amount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    })
  }

  async destroy({ params, response }: HttpContext) {
    const product = await Product.find(params.id)

    if (!product) {
      return response.notFound({ message: 'Product not found' })
    }

    await product.delete()

    return response.ok({ message: 'Product deleted successfully' })
  }
}
