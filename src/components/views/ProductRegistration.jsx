import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '@/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useSelector } from 'react-redux';

function ProductRegistration() {
    const { productId } = useParams();
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productQunatity, setProductQunatity] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [images, setImages] = useState([]);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const userId = useSelector((state) => state.auth.userId);
    const categories = ['음식', '옷'];

    // 기존 데이터 불러오기
    useEffect(() => {
        if (productId) {
            const fetchProduct = async () => {
                try {
                    const q = query(
                        collection(db, 'Product'),
                        where('productId', '==', parseInt(productId))
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const docSnap = querySnapshot.docs[0];
                        const data = docSnap.data();
                        setProductName(data.productName);
                        setDescription(data.description);
                        setProductPrice(data.productPrice);
                        setProductQunatity(data.productQunatity);
                        setProductCategory(data.productCategory);
                        setExistingImageUrls(data.imageUrls || []);
                    } else {
                        setError('상품을 찾을 수 없습니다.');
                    }
                } catch (error) {
                    console.error('Error fetching product:', error);
                    setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
                }
            };

            fetchProduct();
        }
    }, [productId]);

    const handleImageChange = (e) => {
        setImages(Array.from(e.target.files));
    };

    const generateTimestamp = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!productId && images.length === 0) {
                setError('최소 한 개의 이미지를 추가해주세요.');
                setLoading(false);
                return;
            }

            let imageUrls = [...existingImageUrls];

            if (images.length > 0) {
                // 새 이미지를 업로드하기 전에 기존 이미지를 삭제
                await deleteExistingImages();

                // 새 이미지를 업로드
                imageUrls = await Promise.all(
                    images.map(async (image) => {
                        const timestamp = generateTimestamp();
                        const uniqueImageName = `${image.name}_${timestamp}`; // 타임스탬프를 파일 이름에 추가
                        const imageRef = ref(storage, `Product/${uniqueImageName}`);
                        await uploadBytes(imageRef, image);
                        return await getDownloadURL(imageRef);
                    })
                );
            }

            // 숫자 필드로 변환하여 저장
            const productData = {
                productName,
                description,
                productPrice: parseFloat(productPrice),  // 여기서 문자열을 숫자로 변환
                productQunatity: parseInt(productQunatity, 10),  // 정수로 변환
                productCategory,
                imageUrls,
                sellerId: userId,
            };

            if (productId) {
                // 기존 상품 수정
                const q = query(
                    collection(db, 'Product'),
                    where('productId', '==', parseInt(productId))
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docRef = querySnapshot.docs[0].ref; // 문서 참조 가져오기
                    await updateDoc(docRef, productData);
                } else {
                    setError('상품을 찾을 수 없습니다.');
                    setLoading(false);
                    return;
                }
            } else {
                // 새로운 상품 등록
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

                await addDoc(collection(db, 'Product'), {
                    ...productData,
                    productId: newProductId, // 새롭게 생성된 ProductId 추가
                    createdAt: new Date(),
                });
            }

            navigate('/mypage');
        } catch (error) {
            console.error('상품 등록 중 오류가 발생했습니다.', error);
            setError('상품 등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

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
                        disabled={loading}
                    >
                        {loading ? '등록 중...' : productId ? '상품 수정' : '상품 등록'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProductRegistration;