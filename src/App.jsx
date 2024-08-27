import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import Navbar from './components/views/Navbar';
import Cart from './components/views/Cart';
import { CartProvider } from './context/CarContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const SignupForm = lazy(() => import('./components/views/SignupForm'));
const LoginForm = lazy(() => import('./components/views/LoginForm'));
const Mypage = lazy(() => import('./components/views/Mypage'));
const ProductRegistration = lazy(() => import('./components/views/ProductRegistration'));
const ProductDetail = lazy(() => import('./components/views/ProductDetail'));
const AllProductsPage = lazy(() => import('./components/views/AllProductsPage'));
const Payment = lazy(() => import('./components/views/Payment'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Navbar />
            <Cart />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<AllProductsPage />} />
                <Route path="/signup" element={<SignupForm />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/mypage" element={<Mypage />} />
                <Route path="/product-registration" element={<ProductRegistration />} />
                <Route path="/product-registration/:productId" element={<ProductRegistration />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/payment" element={<Payment />} />
              </Routes>
            </Suspense>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import './App.css';

// import SignupForm from './components/views/SignupForm';
// import LoginForm from './components/views/LoginForm';
// import Mypage from './components/views/Mypage';
// import ProductRegistration from './components/views/ProductRegistration';
// import ProductDetail from './components/views/ProductDetail';
// import AllProductsPage from './components/views/AllProductsPage';
// import Navbar from './components/views/Navbar';
// import Cart from './components/views/Cart';
// import { CartProvider } from './context/CarContext.jsx';
// import { AuthProvider } from './context/AuthContext.jsx'; // AuthContext 추가

// const queryClient = new QueryClient();

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <CartProvider>
//           <Router>
//             <Navbar />
//             <Cart />
//             <Routes>
//               <Route path="/" element={<AllProductsPage />} />
//               <Route path="/signup" element={<SignupForm />} />
//               <Route path="/login" element={<LoginForm />} />
//               <Route path="/mypage" element={<Mypage />} />
//               <Route path="/product-registration" element={<ProductRegistration />} />
//               <Route path="/product-registration/:productId" element={<ProductRegistration />} />
//               <Route path="/product/:productId" element={<ProductDetail />} />
//             </Routes>
//           </Router>
//         </CartProvider>
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;