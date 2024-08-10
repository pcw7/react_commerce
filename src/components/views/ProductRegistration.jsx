import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function ProductRegistration() {
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [images, setImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            const imageUrls = await Promise.all(
                images.map(async (image) => {
                    const imageRef = ref(storage, `Product/${image.name}`);
                    await uploadBytes(imageRef, image);
                    return await getDownloadURL(imageRef);
                })
            );
            
            await addDoc(collection(db, 'Product'), {
                productName,
                description,
                productPrice,
                imageUrls,
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
        <div>
            <h1>판매등록 페이지</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="productName">상품 이름:</label>
                    <input
                        id="productName"
                        type="text"
                        value={productName}
                        onChange={handleProductNameChange}
                        required
                        className="border mt-2 p-2 w-full"
                    />
                </div>
                <div>
                    <label htmlFor="description">상품 상세 설명:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={handleDescriptionChange}
                        required
                        className="border mt-2 p-2 w-full"
                    />
                </div>
                <div>
                    <label htmlFor="price">상품 가격:</label>
                    <input
                        id="price"
                        type="number"
                        value={productPrice}
                        onChange={handlePriceChange}
                        required
                        className="border mt-2 p-2 w-full"
                    />
                </div>
                <div className="mt-4">
                    <label htmlFor="images">상품 이미지 첨부 (여러장 가능):</label>
                    <input
                        id="images"
                        type="file"
                        multiple
                        onChange={handleImageChange}
                        required
                        className="mt-2"
                    />
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
                <button
                    type="submit"
                    className="mt-6 bg-blue-500 text-white py-2 px-4 rounded"
                    disabled={loading}
                >
                    {loading ? '등록 중...' : '상품 등록'}
                </button>
            </form>
        </div>
    );
}

export default ProductRegistration;