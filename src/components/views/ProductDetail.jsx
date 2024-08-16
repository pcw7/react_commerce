import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import Navbar from './Navbar';

function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth.userId); // 현재 로그인한 사용자 ID 가져오기
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const q = query(
                    collection(db, 'Product'),
                    where('productId', '==', parseInt(productId))
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const productData = docSnap.data();
                    setProduct(productData);
                    fetchRelatedProducts(productData.productCategory);  // 같은 카테고리의 상품들을 불러옴
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
                    where('productId', '!=', parseInt(productId))  // 현재 상품 제외
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
    }, [productId]);

    const handleEditClick = () => {
        navigate(`/product-registration/${productId}`);
    };

    const handleDeleteClick = async () => {
        if (!product) return;

        const confirmed = window.confirm('정말 이 상품을 삭제하시겠습니까?');
        if (!confirmed) return;

        try {
            setLoading(true);

            // 1. 이미지 삭제
            if (product.imageUrls && product.imageUrls.length > 0) {
                const deletePromises = product.imageUrls.map((url) => {
                    const imageRef = ref(storage, url);
                    return deleteObject(imageRef);
                });
                await Promise.all(deletePromises);
            }

            // 2. Firestore 문서 삭제
            const q = query(
                collection(db, 'Product'),
                where('productId', '==', parseInt(productId))
            );
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
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">{product.productName}</h1>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <img
                            src={product.imageUrls[0]}  // 메인 이미지
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
                    </div>
                </div>

                {/* 판매자와 로그인한 사용자가 같을 때만 수정/삭제 버튼 표시 */}
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

                {/* 같은 카테고리의 상품들 표시 */}
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