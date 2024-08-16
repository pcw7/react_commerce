import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';  // 여기서 query를 추가로 임포트

function AllProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(
                    collection(db, 'Product'),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const productList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setProducts(productList);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('상품을 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">전체 물품 목록</h1>
                {loading ? (
                    <p>상품을 불러오는 중...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
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
                    <p>등록된 물품이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default AllProductsPage;