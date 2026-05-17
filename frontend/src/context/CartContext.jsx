import { useEffect, useState } from 'react';
import CartContext from './CartContextInstance';

const clampQuantityToStock = (nextQty, stock) => {
  const safeStock = Number(stock) || 0;
  if (safeStock <= 0) return 0;
  return Math.min(nextQty, safeStock);
};

const normalizeCartItem = (item) => ({
  ...item,
  product: item?.product?._id || item?.product || '',
  slug: item?.slug || item?.productData?.slug || item?.product?.slug || '',
  variant: item?.variant
    ? {
        size: item.variant.size || '',
        stock: Number(item.variant.stock) || 0
      }
    : null,
  price: Number(item?.price) || Number(item?.product?.price) || 0
});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) return [];

      const parsed = JSON.parse(savedCart);
      if (!Array.isArray(parsed)) return [];

      return parsed.map(normalizeCartItem);
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variant, qty = 1) => {
    if (!product || !variant) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product === product._id && item.variant?.size === variant.size
      );
      const stock = Number(variant.stock) || 0;

      if (existing) {
        const nextQty = clampQuantityToStock(existing.qty + qty, stock);
        if (nextQty === 0) {
          return prev;
        }

        return prev.map((item) =>
          item.product === product._id && item.variant?.size === variant.size
            ? { ...item, qty: nextQty, variant: { ...item.variant, stock } }
            : item
        );
      }

      const initialQty = clampQuantityToStock(qty, stock);
      if (initialQty === 0) {
        return prev;
      }

      return [
        ...prev,
        {
          product: product._id,
          slug: product.slug || '',
          name: product.name,
          image: product.images?.[0] || '',
          variant: {
            size: variant.size,
            stock
          },
          qty: initialQty,
          price: Number(product.price) || 0
        }
      ];
    });
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product === productId && item.variant?.size === size)
      )
    );
  };

  const updateQuantity = (productId, size, newQty) => {
    if (newQty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.product === productId && item.variant?.size === size
          ? {
              ...item,
              qty: clampQuantityToStock(newQty, item.variant?.stock)
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const replaceCart = (items = []) => {
    if (!Array.isArray(items)) {
      setCart([]);
      localStorage.removeItem('cart');
      return;
    }

    setCart(items.map(normalizeCartItem));
  };

  const cartTotal = cart.reduce((total, item) => {
    const price = Number(item.price) || 0;
    return total + price * item.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        replaceCart,
        cartTotal,
        cartCount: cart.length
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
