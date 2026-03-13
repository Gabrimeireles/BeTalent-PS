import { BaseTransformer } from '@adonisjs/core/transformers'
import type Product from '#models/product'

export default class ProductTransformer extends BaseTransformer<Product> {
  static toResponse(product: Product) {
    return {
      id: product.id,
      name: product.name,
      amount: product.amount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  }

  static collection(products: Product[]) {
    return products.map((product) => this.toResponse(product))
  }

  toObject() {
    return ProductTransformer.toResponse(this.resource)
  }
}
