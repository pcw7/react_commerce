import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';

function Payment() {
    const location = useLocation();
    const { cartItems } = location.state; // 장바구니 아이템을 받아옴
    const navigate = useNavigate();

    const totalAmount = cartItems.reduce((acc, item) => acc + item.productPrice * item.quantity, 0);

    const handlePayment = async () => {
        const { IMP } = window;
        IMP.init('가맹점 식별코드'); // 아임포트 관리자 페이지에서 확인한 가맹점 식별코드

        IMP.request_pay({
            pg: 'html5_inicis', // PG사
            pay_method: 'card', // 결제수단
            merchant_uid: `mid_${new Date().getTime()}`, // 주문번호
            name: '주문명: 결제 테스트',
            amount: totalAmount,  // 결제금액
            buyer_email: '', // 구매자 이메일 (선택 사항)
            buyer_name: '', // 구매자 이름 (선택 사항)
            buyer_tel: '', // 구매자 전화번호 (선택 사항)
            buyer_addr: '', // 구매자 주소 (선택 사항)
            buyer_postcode: '', // 구매자 우편번호 (선택 사항)
        }, async (rsp) => {
            if (rsp.success) {
                console.log('결제 성공', rsp);
                // 결제 성공 시, 주문 내역을 DB에 저장
                await createOrder(rsp);
                navigate('/orderSuccess');  // 주문 성공 페이지로 이동
            } else {
                console.log('결제 실패', rsp);
                alert(`결제에 실패했습니다: ${rsp.error_msg}`);
                // 결제 실패 시, 재고 복구 로직을 여기에 추가해야 합니다.
            }
        });
    };

    const createOrder = async (paymentData) => {
        try {
            await addDoc(collection(db, 'Orders'), {
                userId: 'test-user-id', // 사용자 ID
                items: cartItems,
                totalAmount,
                paymentData,
                createdAt: new Date(),
            });
            // 주문 생성 후 장바구니 비우기 로직을 추가합니다.
        } catch (error) {
            console.error('주문 생성 중 오류 발생:', error);
        }
    };

    // 가격 포맷 함수
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