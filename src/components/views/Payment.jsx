import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '../../context/AuthContext';

function Payment() {
    const location = useLocation();
    const { cartItems } = location.state; // 장바구니 아이템을 받아옴
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.userId;

    const totalAmount = cartItems.reduce((acc, item) => acc + item.productPrice * item.quantity, 0);

    const handlePayment = async () => {
        if (!userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        try {
            // Firestore 트랜잭션을 사용하여 상품 수량을 먼저 감소시킵니다.
            await runTransaction(db, async (transaction) => {
                for (const cartItem of cartItems) {
                    const productQuery = query(collection(db, 'Product'), where('productId', '==', cartItem.productId));
                    const productSnapshot = await getDocs(productQuery);

                    if (!productSnapshot.empty) {
                        const productDoc = productSnapshot.docs[0]; // 첫 번째 문서를 가져옴
                        const productRef = productDoc.ref; // 문서의 참조를 가져옴
                        const currentQuantity = productDoc.data().productQunatity;

                        if (currentQuantity < cartItem.quantity) {
                            throw new Error(`상품 "${cartItem.productName}"의 수량이 부족합니다.`);
                        }

                        // 수량을 감소시킵니다.
                        const newQuantity = currentQuantity - cartItem.quantity;
                        transaction.update(productRef, { productQunatity: newQuantity });
                    } else {
                        throw new Error(`상품 "${cartItem.productName}"을 찾을 수 없습니다.`);
                    }
                }
            });

            // 상품 수량 감소가 성공한 후에 결제를 진행합니다.
            const { IMP } = window;
            IMP.init('imp05478634');
            IMP.request_pay({
                pg: 'html5_inicis', // 설정한 PG사
                pay_method: 'card', // 결제수단
                merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
                name: '주문명: 결제 테스트',
                amount: totalAmount,  // 결제금액
                buyer_email: '', // 테스트용 구매자 이메일
                buyer_name: '', // 테스트용 구매자 이름
                buyer_tel: '', // 테스트용 구매자 전화번호
                buyer_addr: '', // 테스트용 구매자 주소
                buyer_postcode: '', // 테스트용 구매자 우편번호
            }, async (rsp) => {
                if (rsp.success) {
                    console.log('결제 성공', rsp);
                    await createOrder(rsp);
                    navigate('/orderSuccess');
                } else {
                    console.log('결제 실패', rsp);
                    alert(`결제에 실패했습니다: ${rsp.error_msg}`);
                    await rollbackStock();
                }
            });
        } catch (error) {
            alert(error.message);
            console.error('결제 처리 중 오류 발생:', error);
        }
    };

    const rollbackStock = async () => {
        try {
            await runTransaction(db, async (transaction) => {
                for (const cartItem of cartItems) {
                    const productQuery = query(collection(db, 'Product'), where('productId', '==', cartItem.productId));
                    const productSnapshot = await getDocs(productQuery);

                    if (!productSnapshot.empty) {
                        const productDoc = productSnapshot.docs[0];
                        const productRef = productDoc.ref;
                        const currentQuantity = productDoc.data().productQunatity;
                        transaction.update(productRef, {
                            productQunatity: currentQuantity + cartItem.quantity,
                        });
                    }
                }
            });
        } catch (error) {
            console.error('재고 복구 중 오류 발생:', error);
        }
    };

    const createOrder = async (paymentData) => {
        try {
            await addDoc(collection(db, 'Orders'), {
                userId: userId,
                items: cartItems,
                totalAmount,
                // paymentData,
                status: 'Payment completed',
                createdAt: new Date(),
            });
        } catch (error) {
            console.error('주문 생성 중 오류 발생:', error);
        }
    };

    const formatPrice = (price) => {
        return price.toLocaleString('ko-KR') + '원';
    };

    return (
        <div className="checkout-container">
            <h1>결제 페이지</h1>
            <ul className="divide-y divide-gray-200">
                {cartItems.map((item, index) => (
                    <li key={index} className="py-2 flex items-center">
                        <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded mr-4" />
                        <div className="flex justify-between flex-grow space-x-4">
                            <p className="flex-1">{item.productName}</p>
                            <p className="flex-1 text-center">{formatPrice(item.productPrice)}</p>
                            <p className="flex-1">수량: {item.quantity}</p>
                            <p className="flex-1 text-right">총 금액: {formatPrice(item.productPrice * item.quantity)}</p>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="font-semibold text-lg mt-4">총 결제금액: {formatPrice(totalAmount)}</p>
            <button onClick={handlePayment} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                결제하기
            </button>
        </div>
    );
}

export default Payment;