import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy, where, limit, startAfter } from 'firebase/firestore';
import { useInView } from 'react-intersection-observer';

function AllProductsPage() {
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [sortOrder, setSortOrder] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const navigate = useNavigate();
    const { ref, inView } = useInView();  // Intersection Observer

    const fetchProducts = async ({ pageParam = null }) => {
        try {
            let q;
            if (selectedCategory === '전체') {
                q = query(
                    collection(db, 'Product'),
                    orderBy(sortOrder, sortDirection),
                    ...(pageParam ? [startAfter(pageParam)] : []),
                    limit(10)
                );
            } else {
                q = query(
                    collection(db, 'Product'),
                    where('productCategory', '==', selectedCategory),
                    orderBy(sortOrder, sortDirection),
                    ...(pageParam ? [startAfter(pageParam)] : []),
                    limit(10)
                );
            }
            const querySnapshot = await getDocs(q);
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];  // 마지막 문서
            const productList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return {
                products: productList,
                nextCursor: lastVisible,  // 다음 페이지의 시작점
            };
        } catch (err) {
            throw new Error('상품을 불러오는 중 오류가 발생했습니다.');
        }
    };

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['products', selectedCategory, sortOrder, sortDirection],
        queryFn: fetchProducts,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });

    // Intersection Observer로 감지되면 다음 페이지 로드
    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    const handleSortChange = (order, direction) => {
        setSortOrder(order);
        setSortDirection(direction);
    };

    const formatPrice = (price) => {
        return price.toLocaleString('ko-KR') + '원';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">전체 물품 목록</h1>
                </div>

                {/* 카테고리 선택 섹션 */}
                <div className="flex items-center mb-6">
                    <div className="w-auto mr-4">
                        <select
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            className="p-2 border border-gray-300 rounded w-auto"
                        >
                            <option value="전체">전체</option>
                            <option value="음식">음식</option>
                            <option value="옷">옷</option>
                            {/* 다른 카테고리들도 추가 가능 */}
                        </select>
                    </div>
                    {/* 정렬 버튼 섹션 */}
                    <div className="flex space-x-4">
                        <button
                            onClick={() => handleSortChange('createdAt', 'desc')}
                            className={`px-4 py-2 rounded ${sortOrder === 'createdAt' && sortDirection === 'desc'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200'
                                }`}
                        >
                            최신순
                        </button>
                        <button
                            onClick={() => handleSortChange('productPrice', 'desc')}
                            className={`px-4 py-2 rounded ${sortOrder === 'productPrice' && sortDirection === 'desc'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200'
                                }`}
                        >
                            높은 가격순
                        </button>
                        <button
                            onClick={() => handleSortChange('productPrice', 'asc')}
                            className={`px-4 py-2 rounded ${sortOrder === 'productPrice' && sortDirection === 'asc'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200'
                                }`}
                        >
                            낮은 가격순
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <p>상품을 불러오는 중...</p>
                ) : error ? (
                    <p className="text-red-500">{error.message}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data.pages.map((page) =>
                                page.products.map((product) => (
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
                                        <p className="text-red-500 font-bold mt-1">{formatPrice(product.productPrice)}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div ref={ref} className="flex justify-center mt-4">
                            {isFetchingNextPage ? <p>더 불러오는 중...</p> : null}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AllProductsPage;