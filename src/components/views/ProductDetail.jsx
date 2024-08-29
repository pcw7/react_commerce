import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db, storage } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useCart } from '../../context/CarContext';
import Cart from './Cart';
import { useAuth } from '../../context/AuthContext';

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.userId;
    const queryClient = useQueryClient();
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [selectedImage, setSelectedImage] = useState('');
    const [sellerInfo, setSellerInfo] = useState(null);
    const { incrementCartCount, openCart, closeCart, isCartOpen } = useCart();

    // 상품 정보 가져오기
    const { data: product, isLoading, error, refetch } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                return docSnap.data();
            } else {
                throw new Error('상품을 찾을 수 없습니다.');
            }
        },
    });

    // 장바구니에 이미 있는지 확인
    const { data: isInCart } = useQuery({
        queryKey: ['cartItem', userId, productId],
        queryFn: async () => {
            if (!userId) return false;
            const cartQuery = query(
                collection(db, 'CartHistory'),
                where('userId', '==', userId),
                where('productId', '==', parseInt(productId))
            );
            const cartSnapshot = await getDocs(cartQuery);
            return !cartSnapshot.empty;
        },
        enabled: !!userId,
    });

    // 판매자 정보 가져오기
    const fetchSellerInfo = useCallback(async (sellerId) => {
        try {
            // sellerId로 User 컬렉션에서 userId 찾기
            const sellerQuery = query(collection(db, 'User'), where('userId', '==', sellerId));
            const sellerSnapshot = await getDocs(sellerQuery);
            if (!sellerSnapshot.empty) {
                const sellerDoc = sellerSnapshot.docs[0].data();
                setSellerInfo(sellerDoc);
            } else {
                console.error('판매자 정보를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('판매자 정보를 불러오는 중 오류가 발생했습니다.', error);
        }
    }, []);

    // 관련 상품 가져오기 함수
    const fetchRelatedProducts = useCallback(async (category) => {
        try {
            const q = query(
                collection(db, 'Product'),
                where('productCategory', '==', category),
                where('productId', '!=', parseInt(productId))
            );
            const querySnapshot = await getDocs(q);
            const relatedProductList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRelatedProducts(relatedProductList);
        } catch (err) {
            console.error('관련 상품을 불러오는 중 오류가 발생했습니다.', err);
        }
    }, [productId]);

    useEffect(() => {
        if (product) {
            setSelectedImage(product.imageUrls[0]);
            fetchRelatedProducts(product.productCategory);
            fetchSellerInfo(product.sellerId); // 판매자 정보 가져오기
        }
    }, [product, fetchRelatedProducts, fetchSellerInfo]);

    const handleAddToCart = useCallback(async () => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        try {
            const cartRef = collection(db, 'CartHistory');
            const q = query(cartRef, where('userId', '==', userId), where('productId', '==', parseInt(productId)));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert('장바구니에 이미 있습니다.');
            } else {
                await addDoc(cartRef, {
                    userId,
                    productId: parseInt(productId),
                    quantity: 1,
                });
                alert('장바구니에 추가되었습니다.');

                // 상태 업데이트
                await refetch(); // 장바구니 상태 재조회
                incrementCartCount(); // 장바구니 아이템 수 증가
                queryClient.invalidateQueries(['cartItems', userId]); // 장바구니 데이터 새로고침
            }
        } catch (error) {
            console.error('장바구니에 추가하는 중 오류가 발생했습니다.', error);
        }
    }, [userId, productId, refetch, incrementCartCount, queryClient, navigate]);

    const handleEditClick = useCallback(() => {
        navigate(`/product-registration/${productId}`);
    }, [navigate, productId]);

    const handleDeleteClick = useCallback(async () => {
        if (!product) return;

        const confirmed = window.confirm('정말 이 상품을 삭제하시겠습니까?');
        if (!confirmed) return;

        try {
            if (product.imageUrls && product.imageUrls.length > 0) {
                const deletePromises = product.imageUrls.map((url) => {
                    const imageRef = ref(storage, url);
                    return deleteObject(imageRef);
                });
                await Promise.all(deletePromises);
            }

            const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await deleteDoc(docRef);
            } else {
                alert('상품을 찾을 수 없습니다.');
                return;
            }

            alert('상품이 삭제되었습니다.');
            navigate('/mypage');
        } catch (err) {
            console.error('상품 삭제 중 오류가 발생했습니다.', err);
            alert('상품 삭제 중 오류가 발생했습니다.');
        }
    }, [product, productId, navigate]);

    const formatPrice = useMemo(() => (price) => {
        return price.toLocaleString('ko-KR') + '원';
    }, []);

    if (isLoading) {
        return <p>상품 정보를 불러오는 중...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error.message}</p>;
    }

    if (!product) {
        return <p>상품 정보를 찾을 수 없습니다.</p>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <img
                            src={selectedImage}
                            alt={`${product.productName} 이미지`}
                            className="w-full h-96 object-cover rounded-lg"
                        />
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {product.imageUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`${product.productName} 이미지 ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg cursor-pointer"
                                    onClick={() => setSelectedImage(url)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-semibold mb-4">{product.description}</p>
                        {sellerInfo ? (
                            <>
                                <p className="text-gray-700 text-lg font-semibold mt-2">판매자 이름: {sellerInfo.username}</p>
                            </>
                        ) : (
                            <p>판매자 정보를 불러오는 중...</p>
                        )}
                        <p className="text-gray-700 text-lg font-semibold mt-2">카테고리: {product.productCategory}</p>
                        <p className="text-gray-700 text-lg font-semibold mt-2">수량: {product.productQunatity}</p>
                        <p className="text-red-500 text-2xl font-bold">{formatPrice(product.productPrice)}</p>

                        {isInCart ? (
                            <button
                                onClick={openCart}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:shadow-outline"
                            >
                                장바구니 보기
                            </button>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:shadow-outline"
                            >
                                장바구니 추가
                            </button>
                        )}
                    </div>
                </div>

                {/* 물품 수정/삭제 버튼 - 판매자만 표시 */}
                {product.sellerId === userId && (
                    <div className="flex space-x-4 mt-8">
                        <button
                            onClick={handleEditClick}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            물품 수정
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            물품 삭제
                        </button>
                    </div>
                )}

                {/* 관련 상품 표시 */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">같은 카테고리의 상품들</h2>
                    {relatedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct.id}
                                    className="border rounded-lg p-4 shadow-sm cursor-pointer"
                                    onClick={() => navigate(`/product/${relatedProduct.productId}`)}
                                >
                                    <img
                                        src={relatedProduct.imageUrls[0]}
                                        alt={`${relatedProduct.productName} 이미지`}
                                        className="w-full h-48 object-cover rounded-t-lg"
                                    />
                                    <h3 className="text-lg font-semibold mt-2">{relatedProduct.productName}</h3>
                                    <p className="text-gray-600">{relatedProduct.description}</p>
                                    <p className="text-red-500 font-bold mt-1">{formatPrice(relatedProduct.productPrice)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>같은 카테고리의 다른 상품이 없습니다.</p>
                    )}
                </div>

                <Cart isOpen={isCartOpen} onClose={closeCart} />
            </div>
        </div>
    );
}

export default React.memo(ProductDetail);

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { db, storage } from '@/firebase';
// import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
// import { ref, deleteObject } from 'firebase/storage';
// import { useCart } from '../../context/CarContext';
// import Cart from './Cart';
// import { useAuth } from '../../context/AuthContext';

// function ProductDetail() {
//     const { productId } = useParams();
//     const navigate = useNavigate();
//     const { user } = useAuth();
//     const userId = user?.userId;
//     const queryClient = useQueryClient();
//     const [relatedProducts, setRelatedProducts] = useState([]);
//     const [selectedImage, setSelectedImage] = useState('');
//     const { incrementCartCount, openCart, closeCart, isCartOpen } = useCart();

//     // 상품 정보 가져오기
//     const { data: product, isLoading, error } = useQuery({
//         queryKey: ['product', productId],
//         queryFn: async () => {
//             const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
//             const querySnapshot = await getDocs(q);
//             if (!querySnapshot.empty) {
//                 const docSnap = querySnapshot.docs[0];
//                 return docSnap.data();
//             } else {
//                 throw new Error('상품을 찾을 수 없습니다.');
//             }
//         },
//     });

//     // 장바구니에 이미 있는지 확인
//     const { data: isInCart, refetch } = useQuery({
//         queryKey: ['cartItem', userId, productId],
//         queryFn: async () => {
//             if (!userId) return false;
//             const cartQuery = query(
//                 collection(db, 'CartHistory'),
//                 where('userId', '==', userId),
//                 where('productId', '==', parseInt(productId))
//             );
//             const cartSnapshot = await getDocs(cartQuery);
//             return !cartSnapshot.empty;
//         },
//         enabled: !!userId,
//     });

//     useEffect(() => {
//         if (product) {
//             setSelectedImage(product.imageUrls[0]);
//             fetchRelatedProducts(product.productCategory);
//         }
//     }, [product]);

//     const fetchRelatedProducts = async (category) => {
//         try {
//             const q = query(
//                 collection(db, 'Product'),
//                 where('productCategory', '==', category),
//                 where('productId', '!=', parseInt(productId))
//             );
//             const querySnapshot = await getDocs(q);
//             const relatedProductList = querySnapshot.docs.map((doc) => ({
//                 id: doc.id,
//                 ...doc.data(),
//             }));
//             setRelatedProducts(relatedProductList);
//         } catch (err) {
//             console.error('관련 상품을 불러오는 중 오류가 발생했습니다.', err);
//         }
//     };

//     const handleAddToCart = async () => {
//         if (!userId) {
//             alert('로그인이 필요합니다.');
//             navigate('/login');
//             return;
//         }

//         try {
//             const cartRef = collection(db, 'CartHistory');
//             const q = query(cartRef, where('userId', '==', userId), where('productId', '==', parseInt(productId)));
//             const querySnapshot = await getDocs(q);

//             if (!querySnapshot.empty) {
//                 alert('장바구니에 이미 있습니다.');
//             } else {
//                 await addDoc(cartRef, {
//                     userId,
//                     productId: parseInt(productId),
//                     quantity: 1,
//                 });
//                 alert('장바구니에 추가되었습니다.');

//                 // 상태 업데이트
//                 await refetch(); // 장바구니 상태 재조회
//                 incrementCartCount(); // 장바구니 아이템 수 증가
//                 queryClient.invalidateQueries(['cartItems', userId]); // 장바구니 데이터 새로고침
//             }
//         } catch (error) {
//             console.error('장바구니에 추가하는 중 오류가 발생했습니다.', error);
//         }
//     };

//     const handleEditClick = () => {
//         navigate(`/product-registration/${productId}`);
//     };

//     const handleDeleteClick = async () => {
//         if (!product) return;

//         const confirmed = window.confirm('정말 이 상품을 삭제하시겠습니까?');
//         if (!confirmed) return;

//         try {
//             if (product.imageUrls && product.imageUrls.length > 0) {
//                 const deletePromises = product.imageUrls.map((url) => {
//                     const imageRef = ref(storage, url);
//                     return deleteObject(imageRef);
//                 });
//                 await Promise.all(deletePromises);
//             }

//             const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
//             const querySnapshot = await getDocs(q);
//             if (!querySnapshot.empty) {
//                 const docRef = querySnapshot.docs[0].ref;
//                 await deleteDoc(docRef);
//             } else {
//                 alert('상품을 찾을 수 없습니다.');
//                 return;
//             }

//             alert('상품이 삭제되었습니다.');
//             navigate('/mypage');
//         } catch (err) {
//             console.error('상품 삭제 중 오류가 발생했습니다.', err);
//             alert('상품 삭제 중 오류가 발생했습니다.');
//         }
//     };

//     const formatPrice = (price) => {
//         return price.toLocaleString('ko-KR') + '원';
//     };

//     if (isLoading) {
//         return <p>상품 정보를 불러오는 중...</p>;
//     }

//     if (error) {
//         return <p className="text-red-500">{error.message}</p>;
//     }

//     if (!product) {
//         return <p>상품 정보를 찾을 수 없습니다.</p>;
//     }

//     return (
//         <div className="min-h-screen bg-gray-100">
//             <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
//                 <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
//                 <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <img
//                             src={selectedImage}
//                             alt={`${product.productName} 이미지`}
//                             className="w-full h-96 object-cover rounded-lg"
//                         />
//                         <div className="mt-4 grid grid-cols-4 gap-2">
//                             {product.imageUrls.map((url, index) => (
//                                 <img
//                                     key={index}
//                                     src={url}
//                                     alt={`${product.productName} 이미지 ${index + 1}`}
//                                     className="w-full h-24 object-cover rounded-lg cursor-pointer"
//                                     onClick={() => setSelectedImage(url)}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                     <div>
//                         <p className="text-xl font-semibold mb-4">{product.description}</p>
//                         <p className="text-red-500 text-2xl font-bold">{formatPrice(product.productPrice)}</p>
//                         <p className="text-gray-700 text-lg font-semibold mt-2">수량: {product.productQunatity}</p>
//                         <p className="text-gray-700 text-lg font-semibold mt-2">카테고리: {product.productCategory}</p>

//                         {isInCart ? (
//                             <button
//                                 onClick={openCart}
//                                 className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:shadow-outline"
//                             >
//                                 장바구니 보기
//                             </button>
//                         ) : (
//                             <button
//                                 onClick={handleAddToCart}
//                                 className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:shadow-outline"
//                             >
//                                 장바구니 추가
//                             </button>
//                         )}
//                     </div>
//                 </div>

//                 {/* 물품 수정/삭제 버튼 - 판매자만 표시 */}
//                 {product.sellerId === userId && (
//                     <div className="flex space-x-4 mt-8">
//                         <button
//                             onClick={handleEditClick}
//                             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                         >
//                             물품 수정
//                         </button>
//                         <button
//                             onClick={handleDeleteClick}
//                             className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                         >
//                             물품 삭제
//                         </button>
//                     </div>
//                 )}

//                 {/* 관련 상품 표시 */}
//                 <div className="mt-12">
//                     <h2 className="text-2xl font-bold text-gray-900 mb-4">같은 카테고리의 상품들</h2>
//                     {relatedProducts.length > 0 ? (
//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                             {relatedProducts.map((relatedProduct) => (
//                                 <div
//                                     key={relatedProduct.id}
//                                     className="border rounded-lg p-4 shadow-sm cursor-pointer"
//                                     onClick={() => navigate(`/product/${relatedProduct.productId}`)}
//                                 >
//                                     <img
//                                         src={relatedProduct.imageUrls[0]}
//                                         alt={`${relatedProduct.productName} 이미지`}
//                                         className="w-full h-48 object-cover rounded-t-lg"
//                                     />
//                                     <h3 className="text-lg font-semibold mt-2">{relatedProduct.productName}</h3>
//                                     <p className="text-gray-600">{relatedProduct.description}</p>
//                                     <p className="text-red-500 font-bold mt-1">{formatPrice(relatedProduct.productPrice)}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <p>같은 카테고리의 다른 상품이 없습니다.</p>
//                     )}
//                 </div>

//                 <Cart isOpen={isCartOpen} onClose={closeCart} />
//             </div>
//         </div>
//     );
// }

// export default ProductDetail;