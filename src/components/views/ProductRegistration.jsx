import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '@/firebase';
import { collection, query, where, doc, getDocs, updateDoc, addDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';

function ProductRegistration() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productQunatity, setProductQunatity] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [images, setImages] = useState([]);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const userId = user?.userId;
    const categories = ['음식', '옷'];
    const queryClient = useQueryClient();

    // 기존 데이터 가져오기
    const { data: productData, isLoading: loadingProductData } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const q = query(collection(db, 'Product'), where('productId', '==', parseInt(productId)));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            } else {
                throw new Error('상품을 찾을 수 없습니다.');
            }
        },
        enabled: !!productId,  // productId가 있을 때만 쿼리 실행
    });

    useEffect(() => {
        if (productData) {
            setProductName(productData.productName || '');
            setDescription(productData.description || '');
            setProductPrice(productData.productPrice || '');
            setProductQunatity(productData.productQunatity || '');
            setProductCategory(productData.productCategory || '');
            setExistingImageUrls(productData.imageUrls || []);
        }
    }, [productData]);

    // 이미지 변경 핸들러
    const handleImageChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    // 기존 이미지 삭제
    const deleteExistingImages = async () => {
        try {
            for (const url of existingImageUrls) {
                const imageRef = ref(storage, url);
                await deleteObject(imageRef);
            }
        } catch (error) {
            console.error('기존 이미지를 삭제하는 중 오류가 발생했습니다:', error);
        }
    };

    // 상품 등록 Mutation
    const addProductMutation = useMutation({
        mutationFn: async (newProductData) => {
            await addDoc(collection(db, 'Product'), newProductData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries('products');
            navigate('/mypage');
        },
        onError: () => {
            setError('상품 등록 중 오류가 발생했습니다.');
        }
    });

    // 상품 수정 Mutation
    const updateProductMutation = useMutation({
        mutationFn: async (updatedProductData) => {
            const q = query(
                collection(db, 'Product'),
                where('productId', '==', parseInt(productId))
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, updatedProductData);
            } else {
                throw new Error('상품을 찾을 수 없습니다.');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['product', productId]);
            navigate('/mypage');
        },
        onError: () => {
            setError('상품 수정 중 오류가 발생했습니다.');
        }
    });

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setError('사용자 정보가 없습니다.');
            return;
        }

        if (!productId && images.length === 0) {
            setError('최소 한 개의 이미지를 추가해주세요.');
            return;
        }

        let imageUrls = [...existingImageUrls];

        try {
            if (images.length > 0) {
                await deleteExistingImages();
                imageUrls = await Promise.all(
                    images.map(async (image) => {
                        const timestamp = new Date().toISOString();
                        const uniqueImageName = `${image.name}_${timestamp}`;
                        const imageRef = ref(storage, `Product/${uniqueImageName}`);
                        await uploadBytes(imageRef, image);
                        return await getDownloadURL(imageRef);
                    })
                );
            }

            const productData = {
                productName,
                description,
                productPrice: parseFloat(productPrice),
                productQunatity: parseInt(productQunatity, 10),
                productCategory,
                imageUrls,
                sellerId: userId,
                createdAt: new Date(),
            };

            if (productId) {
                updateProductMutation.mutate(productData);
            } else {
                const newProductId = await runTransaction(db, async (transaction) => {
                    const counterRef = doc(db, 'Counters', 'productCounter');
                    const counterDoc = await transaction.get(counterRef);
                    if (!counterDoc.exists()) {
                        throw new Error('Counter document does not exist!');
                    }
                    const newProductId = counterDoc.data().count + 1;
                    transaction.update(counterRef, { count: newProductId });
                    return newProductId;
                });

                addProductMutation.mutate({
                    ...productData,
                    productId: newProductId,
                });
            }
        } catch (error) {
            console.error('상품 등록 중 오류가 발생했습니다.', error);
            setError('상품 등록 중 오류가 발생했습니다.');
        }
    };

    // 로딩 상태 처리
    if (loadingProductData) {
        return <p>상품 정보를 불러오는 중...</p>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
                <h2 className="text-3xl font-semibold text-center mb-6">{productId ? '상품 수정' : '상품 등록'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="productName" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 이름:
                        </label>
                        <input
                            id="productName"
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 설명:
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 가격:
                        </label>
                        <input
                            id="price"
                            type="number"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="qunatity" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 갯수:
                        </label>
                        <input
                            id="qunatity"
                            type="number"
                            value={productQunatity}
                            onChange={(e) => setProductQunatity(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 카테고리:
                        </label>
                        <select
                            id="category"
                            value={productCategory}
                            onChange={(e) => setProductCategory(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">카테고리를 선택하세요</option>
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="images" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 이미지 첨부 (여러장 가능):
                        </label>
                        <input
                            id="images"
                            type="file"
                            multiple
                            onChange={handleImageChange}
                            className="mt-2"
                        />
                        {existingImageUrls.length > 0 && (
                            <div className="mt-4">
                                <p className="text-gray-700 text-sm font-bold mb-2">기존 이미지:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {existingImageUrls.map((url, index) => (
                                        <img key={index} src={url} alt={`기존 이미지 ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        disabled={addProductMutation.isLoading || updateProductMutation.isLoading}
                    >
                        {addProductMutation.isLoading || updateProductMutation.isLoading ? '처리 중...' : productId ? '상품 수정' : '상품 등록'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProductRegistration;