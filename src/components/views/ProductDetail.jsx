import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { db, storage } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useCart } from '../../context/CarContext';  // CartContext 사용
import Cart from './Cart';

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth.userId);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isInCart, setIsInCart] = useState(false);
    const { incrementCartCount, openCart, closeCart, isCartOpen } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const productData = docSnap.data();
                    setProduct(productData);
                    fetchRelatedProducts(productData.productCategory);

                    const cartQuery = query(
                        collection(db, 'CartHistory'),
                        where('userId', '==', userId),
                        where('productId', '==', parseInt(productId))
                    );
                    const cartSnapshot = await getDocs(cartQuery);
                    if (!cartSnapshot.empty) {
                        setIsInCart(true);
                    }
                } else {
                    setError('상품을 찾을 수 없습니다.');
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        const fetchRelatedProducts = async (category) => {
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
                console.error('Error fetching related products:', err);
                setError('관련 상품을 불러오는 중 오류가 발생했습니다.');
            }
        };

        fetchProduct();
    }, [productId, userId]);

    const handleEditClick = () => {
        navigate(`/product-registration/${productId}`);
    };

    const handleDeleteClick = async () => {
        if (!product) return;

        const confirmed = window.confirm('정말 이 상품을 삭제하시겠습니까?');
        if (!confirmed) return;

        try {
            setLoading(true);

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
                setError('상품을 찾을 수 없습니다.');
                setLoading(false);
                return;
            }

            navigate('/mypage');
        } catch (err) {
            console.error('상품 삭제 중 오류가 발생했습니다.', err);
            setError('상품 삭제 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!userId || !productId) return;

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
                    qunatity: 1,
                });
                alert('장바구니에 추가되었습니다.');
                setIsInCart(true);
                incrementCartCount();
            }
        } catch (error) {
            console.error('장바구니에 추가하는 중 오류가 발생했습니다.', error);
            setError('장바구니에 추가하는 중 오류가 발생했습니다.');
        }
    };

    const handleItemRemoved = (removedProductId) => {
        if (parseInt(productId) === removedProductId) {
            setIsInCart(false);
        }
    };

    if (loading) {
        return <p>상품 정보를 불러오는 중...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
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
                            src={product.imageUrls[0]}
                            alt={`${product.productName} 이미지`}
                            className="w-full h-96 object-cover rounded-lg"
                        />
                        <div className="mt-4 grid grid-cols-4 gap-2">
                            {product.imageUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={url}
                                    alt={`${product.productName} 이미지 ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xl font-semibold mb-4">{product.description}</p>
                        <p className="text-red-500 text-2xl font-bold">{product.productPrice}원</p>
                        <p className="text-gray-700 text-lg font-semibold mt-2">수량: {product.productQunatity}</p>
                        <p className="text-gray-700 text-lg font-semibold mt-2">카테고리: {product.productCategory}</p>

                        {isInCart ? (
                            <button
                                onClick={openCart}  // CartContext의 openCart 사용
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
                <Cart isOpen={isCartOpen} onClose={closeCart} onItemRemoved={handleItemRemoved} />

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
                            disabled={loading}
                        >
                            {loading ? '삭제 중...' : '물품 삭제'}
                        </button>
                    </div>
                )}

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
                                    <p className="text-red-500 font-bold mt-1">{relatedProduct.productPrice}원</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>같은 카테고리의 다른 상품이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;