import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '@/firebase';
import { useSelector } from 'react-redux';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function ProductRegistration() {
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const userId = useSelector((state) => state.auth.userId);

    const handleProductNameChange = (e) => {
        setProductName(e.target.value);
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handlePriceChange = (e) => {
        setProductPrice(e.target.value);
    };

    const handleImageChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (description === '' || images.length === 0) {
            setError('모든 필수 정보를 입력해주세요. 이미지 파일을 첨부해야 합니다.');
            return;
        }

        setLoading(true);
        try {
            // 이미지 업로드
            const imageUrls = await Promise.all(
                images.map(async (image) => {
                    const imageRef = ref(storage, `Product/${image.name}`);
                    await uploadBytes(imageRef, image);
                    return await getDownloadURL(imageRef);
                })
            );

            // ProductId 가져오기 및 증가시키기
            const productId = await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, 'Counters', 'productCounter');
                const counterDoc = await transaction.get(counterRef);
                if (!counterDoc.exists()) {
                    throw new Error('Counter document does not exist!');
                }
                const newProductId = counterDoc.data().count + 1;
                transaction.update(counterRef, { count: newProductId });
                return newProductId;
            });

            // Firestore에 상품 정보 저장
            await addDoc(collection(db, 'Product'), {
                productId, // 증가된 ProductId 저장
                productName,
                description,
                productPrice,
                imageUrls,
                sellerId: userId,
                createdAt: new Date(),
            });

            navigate('/mypage');
        } catch (error) {
            console.error('Error uploading files or saving data:', error);
            setError('상품 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
                <h2 className="text-3xl font-semibold text-center mb-6">상품 등록</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="productName" className="block text-gray-700 text-sm font-bold mb-2">
                            상품 이름:
                        </label>
                        <input
                            id="productName"
                            type="text"
                            value={productName}
                            onChange={handleProductNameChange}
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
                            onChange={handleDescriptionChange}
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
                            onChange={handlePriceChange}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
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
                            required
                            className="mt-2"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
                    <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        disabled={loading}
                    >
                        {loading ? '등록 중...' : '상품 등록'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProductRegistration;