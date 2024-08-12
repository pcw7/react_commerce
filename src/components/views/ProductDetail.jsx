import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function ProductDetail() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
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
                    setProduct(docSnap.data());
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

        fetchProduct();
    }, [productId]);

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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;