import React, { createContext, useContext, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const fetchCartItemCount = async (userId) => {
        if (userId) {
            const cartQuery = query(collection(db, 'CartHistory'), where('userId', '==', userId));
            const cartSnapshot = await getDocs(cartQuery);
            setCartItemCount(cartSnapshot.size);
        }
    };

    const incrementCartCount = () => {
        setCartItemCount((prevCount) => prevCount + 1);
    };

    return (
        <CartContext.Provider value={{ isCartOpen, openCart, closeCart, cartItemCount, fetchCartItemCount, incrementCartCount }}>
            {children}
        </CartContext.Provider>
    );
}