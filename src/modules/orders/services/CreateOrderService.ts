import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const registeredProducts = await this.productsRepository.findAllById(
      products.map(product => {
        return { id: product.id };
      }),
    );

    if (registeredProducts.length !== products.length) {
      throw new AppError('Some of your products were not found');
    }

    const productsWithAvailableQuantity = registeredProducts.filter(
      product =>
        product.quantity >
        products.filter(p => p.id === product.id)[0].quantity,
    );

    if (productsWithAvailableQuantity.length === 0) {
      throw new AppError('Your order is empty');
    }

    const orderProducts = productsWithAvailableQuantity.map(product => {
      return {
        product_id: product.id,
        price: product.price,
        quantity: products.filter(p => p.id === product.id)[0].quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    const updatedQuantities = productsWithAvailableQuantity.map(product => {
      return {
        ...product,
        quantity:
          product.quantity -
          orderProducts.filter(p => p.product_id === product.id)[0].quantity,
      };
    });

    await this.productsRepository.updateQuantity(updatedQuantities);

    return order;
  }
}

export default CreateOrderService;
