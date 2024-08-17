import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
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
                const cartItemsData = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;  // 수량이 1보다 작아지지 않도록

        try {
            // Firestore에서 수량 업데이트
            const itemRef = collection(db, 'CartHistory');
            const itemDoc = query(itemRef, where('userId', '==', userId), where('productId', '==', itemId));
            const querySnapshot = await getDocs(itemDoc);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, { qunatity: newQuantity });

                // 로컬 상태 업데이트
                setCartItems((prevItems) =>
                    prevItems.map((item) =>
                        item.productId === itemId ? { ...item, qunatity: newQuantity } : item
                    )
                );
            }
        } catch (error) {
            console.error('수량 업데이트 중 오류가 발생했습니다.', error);
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            // Firestore에서 해당 항목 삭제
            const itemRef = collection(db, 'CartHistory');
            const itemDoc = query(itemRef, where('userId', '==', userId), where('productId', '==', itemId));
            const querySnapshot = await getDocs(itemDoc);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await deleteDoc(docRef);

                // 로컬 상태에서 아이템 제거
                setCartItems((prevItems) =>
                    prevItems.filter((item) => item.productId !== itemId)
                );
            }
        } catch (error) {
            console.error('장바구니 항목 삭제 중 오류가 발생했습니다.', error);
        }
    };

    return (
        <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
            <div className="p-4">
                <button onClick={onClose} className="text-gray-600 hover:text-gray-800">닫기</button>
                <h2 className="text-2xl font-bold mb-4">장바구니</h2>
                <ul className="divide-y divide-gray-200">
                    {cartItems.map((item, index) => (
                        <li key={index} className="py-2 flex items-center">
                            <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded mr-4" />
                            <div className="flex-grow">
                                <p>{item.productName}</p>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.qunatity - 1)}
                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                    >
                                        -
                                    </button>
                                    <p className="mx-2">{item.qunatity}</p>
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.qunatity + 1)}
                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                                    >
                                        +
                                    </button>
                                </div>
                                <p>{item.productPrice}원</p>
                            </div>
                            {/* 삭제 버튼 */}
                            <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="ml-4 px-2 py-1 bg-red-500 text-white rounded"
                            >
                                삭제
                            </button>
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