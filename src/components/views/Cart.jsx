import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

function Cart({ isOpen, onClose }) {
    const [cartItems, setCartItems] = useState([]);
    const userId = useSelector((state) => state.auth.userId);

    useEffect(() => {
        const fetchCartItemsWithDetails = async () => {
            if (isOpen) {
                // 1. CartHistory에서 사용자 장바구니 아이템을 가져오기
                const cartQuery = query(
                    collection(db, 'CartHistory'),
                    where('userId', '==', userId)
                );
                const cartSnapshot = await getDocs(cartQuery);
                const cartItemsData = cartSnapshot.docs.map(doc => doc.data());

                // 2. 각 CartHistory 아이템에 대해 Product 컬렉션에서 상세 정보 가져오기
                const productPromises = cartItemsData.map(async (cartItem) => {
                    const productQuery = query(
                        collection(db, 'Product'),
                        where('productId', '==', cartItem.productId)
                    );
                    const productSnapshot = await getDocs(productQuery);
                    if (!productSnapshot.empty) {
                        const productData = productSnapshot.docs[0].data();
                        return {
                            ...cartItem,
                            productName: productData.productName,
                            productPrice: productData.productPrice,
                            imageUrl: productData.imageUrls[0]  // 첫 번째 이미지만 사용
                        };
                    } else {
                        return cartItem;  // 상품 정보가 없으면 그대로 반환
                    }
                });

                // 3. 모든 Promise가 완료될 때까지 기다리고, cartItems에 설정
                const detailedCartItems = await Promise.all(productPromises);
                setCartItems(detailedCartItems);
            }
        };

        fetchCartItemsWithDetails();
    }, [isOpen, userId]);

    return (
        <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
            <div className="p-4">
                <button onClick={onClose} className="text-gray-600 hover:text-gray-800">닫기</button>
                <h2 className="text-2xl font-bold mb-4">장바구니</h2>
                <ul className="divide-y divide-gray-200">
                    {cartItems.map((item, index) => (
                        <li key={index} className="py-2 flex items-center">
                            <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded mr-4" />
                            <div>
                                <p>{item.productName}</p>
                                <p>수량: {item.qunatity}</p>
                                <p>{item.productPrice}원</p>
                            </div>
                        </li>
                    ))}
                </ul>
                {/* 총 가격 계산 로직 */}
                <p className="font-semibold text-lg mt-4">총 가격: {cartItems.reduce((acc, item) => acc + item.productPrice * item.qunatity, 0)}원</p>
            </div>
        </div>
    );
}

export default Cart;