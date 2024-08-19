import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase'; // Firebase Auth import
import { doc, getDoc } from 'firebase/firestore';
import './App.css';

import Home from './components/views/Home';
import SignupForm from './components/views/SignupForm';
import LoginForm from './components/views/LoginForm';
import Mypage from './components/views/Mypage';
import ProductRegistration from './components/views/ProductRegistration';
import ProductDetail from './components/views/ProductDetail';
import AllProductsPage from './components/views/AllProductsPage';
import Navbar from './components/views/Navbar';
import Cart from './components/views/Cart';
import { CartProvider } from './context/CarContext.jsx';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Firebase Auth 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자가 로그인한 상태라면 Redux 상태 업데이트
        const userDoc = await getDoc(doc(db, "User", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          dispatch({ type: 'SET_USER_DATA', payload: userData });
        }
      } else {
        // 로그아웃 상태라면 Redux 상태 초기화
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 이벤트 리스너 해제
  }, [dispatch]);

  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Cart />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/product-registration" element={<ProductRegistration />} />
          <Route path="/product-registration/:productId" element={<ProductRegistration />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/all-products" element={<AllProductsPage />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;