import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import Order from '@modules/orders/infra/typeorm/entities/Order';
import Product from '@modules/products/infra/typeorm/entities/Product';

@Entity('orders_products')
class OrdersProducts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  product_id: string;

  // @ManyToOne(() => Product, product => product.order_products, {
  //   cascade: ['insert'],
  // })
  @ManyToOne(() => Product, product => product.order_products)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('uuid')
  order_id: string;

  // @ManyToOne(() => Order, order => order.order_products, {
  //   cascade: ['insert'],
  // })
  @ManyToOne(() => Order, order => order.order_products)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export default OrdersProducts;
