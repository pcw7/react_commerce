import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

function Mypage() {
    const { user, isSeller } = useAuth();
    const userId = user?.userId;
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: products = [], isLoading: isLoadingProducts, error: errorProducts } = useQuery({
        queryKey: ['products', userId],
        queryFn: async () => {
            if (!isSeller) return [];
            const q = query(
                collection(db, 'Product'),
                where('sellerId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        },
        enabled: activeTab === 'products' && isSeller,
    });

    const { data: orders = [], isLoading: isLoadingPurchased, error: errorPurchased } = useQuery({
        queryKey: ['purchasedItems', userId],
        queryFn: async () => {
            const q = query(
                collection(db, 'Orders'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        },
        enabled: activeTab === 'purchasedItems',
    });

    const { data: soldItems = [], isLoading: isLoadingSold, error: errorSold } = useQuery({
        queryKey: ['soldItems', userId],
        queryFn: async () => {
            if (!isSeller) return [];

            // Orders 컬렉션에서 모든 문서 가져오기
            const q = query(
                collection(db, 'Orders'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);

            // 현재 로그인한 사용자의 userId와 일치하는 항목 필터링
            const filteredOrders = querySnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter(order =>
                    order.items.some(item => item.userId === userId)
                );

            return filteredOrders;
        },
        enabled: activeTab === 'soldItems' && isSeller,
    });

    const cancelOrderMutation = useMutation({
        mutationFn: async (orderId) => {
            const orderRef = doc(db, 'Orders', orderId);
            await updateDoc(orderRef, { status: 'CANCELED' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['purchasedItems', userId]);
        },
    });

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleCancelOrder = (orderId) => {
        const confirmed = window.confirm('정말로 주문을 취소하시겠습니까?');
        if (confirmed) {
            cancelOrderMutation.mutate(orderId);
        }
    };

    const renderProfileTab = () => (
        <div>
            <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>
            <p>회원 번호: {userId}</p>
        </div>
    );

    const renderProductsTab = () => (
        <div>
            <h2 className="text-xl font-semibold mb-4">내 판매 물품 목록</h2>
            {isLoadingProducts ? (
                <p>상품을 불러오는 중...</p>
            ) : errorProducts ? (
                <p className="text-red-500">{errorProducts.message}</p>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="border rounded-lg p-4 shadow-sm cursor-pointer"
                            onClick={() => handleProductClick(product.productId)}
                        >
                            <img
                                src={product.imageUrls[0]}
                                alt={`${product.productName} 이미지`}
                                className="w-full h-48 object-cover rounded-t-lg"
                            />
                            <h3 className="text-lg font-semibold mt-2">{product.productName}</h3>
                            <p className="text-gray-600">{product.description}</p>
                            <p className="text-red-500 font-bold mt-1">{product.productPrice}원</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>등록된 판매 물품이 없습니다.</p>
            )}
        </div>
    );

    const renderPurchasedItemsTab = () => (
        <div>
            <h2 className="text-xl font-semibold mb-4">내 구매 내역</h2>
            {isLoadingPurchased ? (
                <p>구매한 물품을 불러오는 중...</p>
            ) : errorPurchased ? (
                <p className="text-red-500">{errorPurchased.message}</p>
            ) : orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const createdAt = order.createdAt ? new Date(order.createdAt.seconds * 1000) : new Date();
                        const totalAmount = order.items.reduce((total, item) => total + item.productPrice * item.quantity, 0); // 총 결제금액 계산
                        return (
                            <div key={order.id} className="border rounded-lg p-4 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">주문 날짜: {createdAt.toLocaleDateString()}</h3>
                                <p className="text-gray-700 mb-2">주문 상태: {order.status}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {order.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-4 shadow-sm cursor-pointer"
                                            onClick={() => handleProductClick(item.productId)}
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt={`${item.productName} 이미지`}
                                                className="w-full h-48 object-cover rounded-t-lg"
                                            />
                                            <h3 className="text-lg font-semibold mt-2">{item.productName}</h3>
                                            <p className="text-gray-600">{item.description}</p>
                                            <p className="text-red-500 font-bold mt-1">{item.productPrice}원</p>
                                            <p className="text-gray-600">수량: {item.quantity}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-lg font-semibold mt-4">총 결제금액: {totalAmount.toLocaleString()}원</p> {/* 총 결제금액 표시 */}
                                {order.status !== 'CANCELED' && (
                                    <button
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        주문 취소
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>구매한 내역이 없습니다.</p>
            )}
        </div>
    );

    const renderSoldItemsTab = () => (
        <div>
            <h2 className="text-xl font-semibold mb-4">판매된 물품 목록</h2>
            {isLoadingSold ? (
                <p>판매된 물품을 불러오는 중...</p>
            ) : errorSold ? (
                <p className="text-red-500">{errorSold.message}</p>
            ) : soldItems.length > 0 ? (
                <div className="space-y-4">
                    {soldItems.map((order) => {
                        const createdAt = order.createdAt ? new Date(order.createdAt.seconds * 1000) : new Date();
                        return (
                            <div key={order.id} className="border rounded-lg p-4 shadow-sm">
                                <h3 className="text-lg font-semibold mb-2">주문 날짜: {createdAt.toLocaleDateString()}</h3>
                                <p className="text-gray-700 mb-2">주문 상태: {order.status}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {order.items
                                        .filter(item => item.userId === userId) // 현재 사용자와 일치하는 항목만 표시
                                        .map((item, index) => (
                                            <div
                                                key={index}
                                                className="border rounded-lg p-4 shadow-sm cursor-pointer"
                                                onClick={() => handleProductClick(item.productId)}
                                            >
                                                <img
                                                    src={item.imageUrl}
                                                    alt={`${item.productName} 이미지`}
                                                    className="w-full h-48 object-cover rounded-t-lg"
                                                />
                                                <h3 className="text-lg font-semibold mt-2">{item.productName}</h3>
                                                <p className="text-gray-600">{item.description}</p>
                                                <p className="text-red-500 font-bold mt-1">{item.productPrice}원</p>
                                                <p className="text-gray-600">수량: {item.quantity}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>판매된 물품이 없습니다.</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
                <div className="tabs mt-6">
                    <button
                        className={`tab ${activeTab === 'profile' ? 'active' : ''} mr-4 px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
                        onClick={() => setActiveTab('profile')}
                    >
                        프로필
                    </button>
                    {isSeller && (
                        <>
                            <button
                                className={`tab ${activeTab === 'products' ? 'active' : ''} mr-4 px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
                                onClick={() => setActiveTab('products')}
                            >
                                판매물품
                            </button>
                            <button
                                className={`tab ${activeTab === 'soldItems' ? 'active' : ''} mr-4 px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
                                onClick={() => setActiveTab('soldItems')}
                            >
                                판매된 물품
                            </button>
                        </>
                    )}
                    <button
                        className={`tab ${activeTab === 'purchasedItems' ? 'active' : ''} px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
                        onClick={() => setActiveTab('purchasedItems')}
                    >
                        구매 내역
                    </button>
                </div>

                <div className="tab-content mt-8">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'products' && isSeller && renderProductsTab()}
                    {activeTab === 'soldItems' && isSeller && renderSoldItemsTab()}
                    {activeTab === 'purchasedItems' && renderPurchasedItemsTab()}
                </div>

                {isSeller && (
                    <Link to="/product-registration">
                        <button className="mt-8 bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            판매등록
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
}

export default Mypage;

// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { db } from '@/firebase';
// import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
// import { useQuery } from '@tanstack/react-query';
// import { useAuth } from '../../context/AuthContext'; // AuthContext에서 인증 상태 가져오기

// function Mypage() {
//     const { user, isSeller } = useAuth(); // AuthContext에서 사용자 정보와 판매자 여부 가져오기
//     const userId = user?.userId; // Firestore의 userId 사용
//     const [activeTab, setActiveTab] = useState('profile');
//     const navigate = useNavigate();

//     const { data: products = [], isLoading, error } = useQuery({
//         queryKey: ['products', userId],
//         queryFn: async () => {
//             if (!isSeller) return [];
//             const q = query(
//                 collection(db, 'Product'),
//                 where('sellerId', '==', userId),
//                 orderBy('createdAt', 'desc')
//             );
//             const querySnapshot = await getDocs(q);
//             return querySnapshot.docs.map((doc) => ({
//                 id: doc.id,
//                 ...doc.data(),
//             }));
//         },
//         enabled: activeTab === 'products' && isSeller, // 판매자일 때만 쿼리 실행
//     });

//     const handleProductClick = (productId) => {
//         navigate(`/product/${productId}`);
//     };

//     const renderProfileTab = () => (
//         <div>
//             <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>
//             <p>회원 번호: {userId}</p>
//         </div>
//     );

//     const renderProductsTab = () => (
//         <div>
//             <h2 className="text-xl font-semibold mb-4">내 판매 물품 목록</h2>
//             {isLoading ? (
//                 <p>상품을 불러오는 중...</p>
//             ) : error ? (
//                 <p className="text-red-500">{error.message}</p>
//             ) : products.length > 0 ? (
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                     {products.map((product) => (
//                         <div
//                             key={product.id}
//                             className="border rounded-lg p-4 shadow-sm cursor-pointer"
//                             onClick={() => handleProductClick(product.productId)} // 클릭 시 상세 페이지로 이동
//                         >
//                             <img
//                                 src={product.imageUrls[0]}
//                                 alt={`${product.productName} 이미지`}
//                                 className="w-full h-48 object-cover rounded-t-lg"
//                             />
//                             <h3 className="text-lg font-semibold mt-2">{product.productName}</h3>
//                             <p className="text-gray-600">{product.description}</p>
//                             <p className="text-red-500 font-bold mt-1">{product.productPrice}원</p>
//                         </div>
//                     ))}
//                 </div>
//             ) : (
//                 <p>등록된 판매 물품이 없습니다.</p>
//             )}
//         </div>
//     );

//     return (
//         <div className="min-h-screen bg-gray-100">
//             <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
//                 <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
//                 <div className="tabs mt-6">
//                     <button
//                         className={`tab ${activeTab === 'profile' ? 'active' : ''} mr-4 px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
//                         onClick={() => setActiveTab('profile')}
//                     >
//                         프로필
//                     </button>
//                     {isSeller && (
//                         <button
//                             className={`tab ${activeTab === 'products' ? 'active' : ''} px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
//                             onClick={() => setActiveTab('products')}
//                         >
//                             판매물품
//                         </button>
//                     )}
//                 </div>

//                 <div className="tab-content mt-8">
//                     {activeTab === 'profile' && renderProfileTab()}
//                     {activeTab === 'products' && isSeller && renderProductsTab()}
//                 </div>

//                 {isSeller && (
//                     <Link to="/product-registration">
//                         <button className="mt-8 bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
//                             판매등록
//                         </button>
//                     </Link>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default Mypage;