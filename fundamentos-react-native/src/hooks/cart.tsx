import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartItems = await AsyncStorage.getItem('@gomarketplace/cart');

      if (cartItems) {
        setProducts([...JSON.parse(cartItems)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productAlreadyInCart = products.find(
        item => item.id === product.id,
      );

      let updatedCart: Product[] = [];
      if (productAlreadyInCart) {
        updatedCart = products.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updatedCart = [...products, { ...product, quantity: 1 }];
      }

      setProducts(updatedCart);

      await AsyncStorage.setItem(
        '@gomarketplace/cart',
        JSON.stringify(updatedCart),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedCart = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );

      setProducts(updatedCart);

      await AsyncStorage.setItem(
        '@gomarketplace/cart',
        JSON.stringify(updatedCart),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedCart = products.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity > 0 ? item.quantity - 1 : 0 }
          : item,
      );

      setProducts(updatedCart);

      await AsyncStorage.setItem(
        '@gomarketplace/cart',
        JSON.stringify(updatedCart),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
