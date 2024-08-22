import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CarContext';
import { useAuth } from '../../context/AuthContext';
import LogoutButton from './LogoutButton';

function Navbar() {
    const { user, isSeller, loading } = useAuth();  // AuthContext에서 로딩 상태도 가져오기
    const { openCart, cartItemCount, fetchCartItemCount } = useCart();  // CartContext에서 장바구니 정보 가져오기

    useEffect(() => {
        if (user?.userId) {  // Firestore의 userId 사용
            fetchCartItemCount(user.userId);  // 장바구니 아이템 개수 가져오기
        }
    }, [user?.userId, fetchCartItemCount]);

    // 로딩 중일 때 로딩 메시지 표시
    if (loading) {
        return <nav className="bg-white shadow-md py-4 px-8">Loading...</nav>;
    }

    return (
        <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center">
            <div>
                <Link to="/" className="text-2xl font-bold text-red-500">SHOP</Link>
            </div>
            <div className="flex items-center space-x-4">
                {user ? (
                    <>
                        <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>
                        <Link to="/mypage" className="text-gray-700">My Page</Link>
                        <button
                            onClick={openCart}
                            className="relative bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            장바구니
                            {cartItemCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                        <LogoutButton />
                    </>
                ) : (
                    <>
                        <Link to="/login" className="text-gray-700">로그인</Link>
                        <Link to="/signup" className="text-gray-700">회원가입</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;