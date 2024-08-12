import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

function Mypage() {
    const isSeller = useSelector(state => state.auth.isSeller);
    const userId = useSelector(state => state.auth.userId);
    const [activeTab, setActiveTab] = useState('profile');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTab === 'products' && isSeller) {
            const fetchProducts = async () => {
                try {
                    const q = query(
                        collection(db, 'Product'),
                        where('sellerId', '==', userId),
                        orderBy('createdAt', 'desc') // 최신순 정렬
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
        }
    }, [activeTab, isSeller, userId]);

    const renderProfileTab = () => (
        <div>
            <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>
            <p>회원 번호: {userId}</p>
        </div>
    );

    const renderProductsTab = () => (
        <div>
            <h2>내 판매 물품 목록</h2>
            {loading ? (
                <p>상품을 불러오는 중...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : products.length > 0 ? (
                <ul>
                    {products.map((product) => (
                        <li key={product.id} className="mt-4">
                            <h3 className="text-lg font-semibold">{product.productName}</h3>
                            <p>{product.description}</p>
                            <p>가격: {product.productPrice}원</p>
                            <div className="flex space-x-4">
                                {product.imageUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`${product.productName} 이미지 ${index + 1}`}
                                        className="w-32 h-32 object-cover mt-2"
                                    />
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>등록된 판매 물품이 없습니다.</p>
            )}
        </div>
    );

    return (
        <div>
            <h1>마이페이지</h1>
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    프로필
                </button>
                {isSeller && (
                    <button
                        className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        판매물품
                    </button>
                )}
            </div>

            <div className="tab-content mt-4">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'products' && isSeller && renderProductsTab()}
            </div>

            {isSeller && (
                <Link to="/product-registration">
                    <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
                        판매등록
                    </button>
                </Link>
            )}
        </div>
    );
}

export default Mypage;