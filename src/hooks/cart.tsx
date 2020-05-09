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
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext>({} as CartContext);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const previousProducts = await AsyncStorage.getItem(
        '@goMarketPlace:products',
      );

      if (previousProducts) {
        setProducts(JSON.parse(previousProducts));
      }
    }

    loadProducts();
  }, []);

  const updateStorage = useCallback(async () => {
    await AsyncStorage.setItem(
      '@goMarketPlace:products',
      JSON.stringify(products),
    );
  }, [products]);

  const increment = useCallback(
    async id => {
      const productExists = products.findIndex(
        productSearch => productSearch.id === id,
      );

      if (productExists >= 0) {
        setProducts(
          products.map((product, index) =>
            index === productExists
              ? { ...product, quantity: product.quantity + 1 }
              : product,
          ),
        );
      }

      updateStorage();
    },
    [products, updateStorage],
  );

  const decrement = useCallback(
    async id => {
      const productExists = products.findIndex(
        productSearch => productSearch.id === id,
      );

      if (productExists >= 0 && products[productExists].quantity >= 1) {
        setProducts(
          products.map((product, index) =>
            index === productExists
              ? { ...product, quantity: product.quantity - 1 }
              : product,
          ),
        );
      }
      updateStorage();
    },
    [products, updateStorage],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        productSearch => productSearch.id === product.id,
      );

      if (productExists) {
        increment(productExists.id);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      updateStorage();
    },
    [increment, products, updateStorage],
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
