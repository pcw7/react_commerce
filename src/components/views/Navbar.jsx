import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LogoutButton from './LogoutButton';

function Navbar() {
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const isSeller = useSelector(state => state.auth.isSeller);

    return (
        <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center">
            <div>
                <Link to="/all-products" className="text-2xl font-bold text-red-500">SHOP</Link>
            </div>
            <div className="flex items-center space-x-4">
                {/* <Link to="/all-products" className="text-gray-700">Home</Link> */}
                <input
                    type="text"
                    placeholder="Search for any product"
                    className="border border-gray-300 p-2 rounded"
                />
                {isAuthenticated ? (
                    <>
                        <p>안녕하세요, {isSeller ? '판매자' : '구매자'}님!</p>
                        <Link to="/mypage" className="text-gray-700">My Page</Link>
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