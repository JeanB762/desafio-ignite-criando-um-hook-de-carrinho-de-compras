import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

export interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => { 
    try {
      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;
      const newCart = [...cart];
      const productInCart = cart.find((p) => p.id === productId);
      
      if (productInCart && productInCart?.amount >= stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      
      if (productInCart) {
        productInCart.amount += 1;
        setCart(
          cart.map((p) =>
            p.id === productId ? { ...p, amount: p.amount + 1 } : p
          )
        );
      } else {
        const productResponse = await api.get(`/products/${productId}`);
        const newProduct = {...productResponse.data, ammount: 1};

        newCart.push(newProduct)
      }

      setCart(newCart)      
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch (error) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => product.id !== productId);
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch (error) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockResponse = await api.get(`/stock/${productId}`);
      const stock = stockResponse.data;
      const productInCart = cart.find((p) => p.id === productId);
      if (productInCart && productInCart?.amount >= stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (productInCart && productInCart?.amount < 0) {
        return;
      }
      if (productInCart) {
        productInCart.amount = amount;
      }
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch (error) {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
