import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCart } from '../../context/CarContext';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function Cart({ onItemRemoved }) {
    const { user } = useAuth();
    const userId = user?.userId; // Firestore의 userId 사용
    const [cartItems, setCartItems] = useState([]);
    const { isCartOpen, closeCart, fetchCartItemCount } = useCart();
    const queryClient = useQueryClient();

    // React Query를 사용하여 장바구니 항목 페칭
    const { data: cartItemsData = [], isLoading, error } = useQuery({
        queryKey: ['cartItems', userId],
        queryFn: async () => {
            if (!userId) return [];

            const cartQuery = query(collection(db, 'CartHistory'), where('userId', '==', userId));
            const cartSnapshot = await getDocs(cartQuery);
            const cartItemsList = cartSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            const productPromises = cartItemsList.map(async (cartItem) => {
                const productQuery = query(collection(db, 'Product'), where('productId', '==', cartItem.productId));
                const productSnapshot = await getDocs(productQuery);
                if (!productSnapshot.empty) {
                    const productData = productSnapshot.docs[0].data();
                    return {
                        ...cartItem,
                        productName: productData.productName,
                        productPrice: productData.productPrice,
                        imageUrl: productData.imageUrls[0],
                    };
                } else {
                    return cartItem;
                }
            });

            return await Promise.all(productPromises);
        },
        enabled: isCartOpen && !!userId, // 장바구니가 열려 있고 userId가 있을 때만 쿼리 실행
        onSuccess: () => {
            fetchCartItemCount(userId); // 장바구니 아이템 개수 업데이트
        },
    });

    // useEffect(() => {
    //     setCartItems(cartItemsData);
    // }, [cartItemsData]);
    useEffect(() => {
        if (JSON.stringify(cartItems) !== JSON.stringify(cartItemsData)) {
            setCartItems(cartItemsData);
        }
    }, [cartItemsData]);

    // 수량 업데이트 Mutation
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ itemId, newQuantity }) => {
            const itemRef = collection(db, 'CartHistory');
            const itemDoc = query(itemRef, where('userId', '==', userId), where('productId', '==', itemId));
            const querySnapshot = await getDocs(itemDoc);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, { quantity: newQuantity });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cartItems', userId]); // 장바구니 데이터 새로고침
            fetchCartItemCount(userId); // 장바구니 아이템 개수 업데이트
        },
    });

    // 항목 삭제 Mutation
    const removeItemMutation = useMutation({
        mutationFn: async (itemId) => {
            const itemRef = collection(db, 'CartHistory');
            const itemDoc = query(itemRef, where('userId', '==', userId), where('productId', '==', itemId));
            const querySnapshot = await getDocs(itemDoc);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await deleteDoc(docRef);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['cartItems', userId]); // 장바구니 데이터 새로고침
            fetchCartItemCount(userId); // 장바구니 아이템 개수 업데이트
            if (onItemRemoved) {
                onItemRemoved(itemId); // onItemRemoved 콜백 호출
            }
        },
    });

    // 수량 변경 핸들러
    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        updateQuantityMutation.mutate({ itemId, newQuantity });
    };

    // 항목 삭제 핸들러
    const handleRemoveItem = (itemId) => {
        removeItemMutation.mutate(itemId);
    };

    // 가격 포맷 함수
    const formatPrice = (price) => {
        return price.toLocaleString('ko-KR') + '원';
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div
            className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'
                } transition-transform duration-300 ease-in-out`}
        >
            <div className="p-4">
                <button onClick={closeCart} className="text-gray-600 hover:text-gray-800">
                    닫기
                </button>
                <h2 className="text-2xl font-bold mb-4">장바구니</h2>
                <ul className="divide-y divide-gray-200">
                    {cartItems.map((item, index) => (
                        <li key={index} className="py-2 flex items-center">
                            <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded mr-4" />
                            <div className="flex-grow">
                                <p>{item.productName}</p>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                    >
                                        -
                                    </button>
                                    <p className="mx-2">{item.quantity}</p>
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                    >
                                        +
                                    </button>
                                </div>
                                <p>{formatPrice(item.productPrice)}</p>
                            </div>
                            <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="ml-4 px-2 py-1 bg-red-500 text-white rounded"
                            >
                                삭제
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="font-semibold text-lg mt-4">
                    총 가격: {formatPrice(cartItems.reduce((acc, item) => acc + item.productPrice * item.quantity, 0))}
                </p>
            </div>
        </div>
    );
}

export default Cart;