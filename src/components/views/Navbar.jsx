import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useCart } from '../../context/CarContext';
import LogoutButton from './LogoutButton';

function Navbar() {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const isSeller = useSelector(state => state.auth.isSeller);
    const userId = useSelector(state => state.auth.userId);
    const { openCart, cartItemCount, fetchCartItemCount } = useCart();  // CartContext에서 사용

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchCartItemCount(userId);  // 장바구니 아이템 개수 가져오기
        }
    }, [isAuthenticated, userId, fetchCartItemCount]);

    return (
        <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center">
            <div>
                <Link to="/all-products" className="text-2xl font-bold text-red-500">SHOP</Link>
            </div>
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    placeholder="Search for any product"
                    className="border border-gray-300 p-2 rounded"
                />
                {isAuthenticated ? (
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
                        <Link to="/login" className="text-gray-700">Login</Link>
                        <Link to="/signup" className="text-gray-700">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;