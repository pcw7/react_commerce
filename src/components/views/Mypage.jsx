import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from './Navbar';

function Mypage() {
    const isSeller = useSelector(state => state.auth.isSeller);
    const userId = useSelector(state => state.auth.userId);
    const [activeTab, setActiveTab] = useState('profile');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'products' && isSeller) {
            const fetchProducts = async () => {
                try {
                    const q = query(
                        collection(db, 'Product'),
                        where('sellerId', '==', userId),
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
        }
    }, [activeTab, isSeller, userId]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
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
                            onClick={() => handleProductClick(product.productId)} // 클릭 시 상세 페이지로 이동
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

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
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
                        <button
                            className={`tab ${activeTab === 'products' ? 'active' : ''} px-4 py-2 text-sm font-medium text-gray-900 bg-white rounded-md shadow`}
                            onClick={() => setActiveTab('products')}
                        >
                            판매물품
                        </button>
                    )}
                </div>

                <div className="tab-content mt-8">
                    {activeTab === 'profile' && renderProfileTab()}
                    {activeTab === 'products' && isSeller && renderProductsTab()}
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