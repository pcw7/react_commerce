import React from 'react';
import { useNavigate } from 'react-router-dom';

function OrderSuccess() {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="order-success-container" style={{ marginTop: '100px' }}>
            <h1>결제가 성공적으로 완료되었습니다!</h1>
            <p>주문이 정상적으로 접수되었습니다. 감사합니다.</p>
            <button onClick={handleGoHome} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                홈으로 이동
            </button>
        </div>
    );
}

export default OrderSuccess;