import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

import Home from './components/views/Home';
import SignupForm from './components/views/SignupForm';
import LoginForm from './components/views/LoginForm';
import Mypage from './components/views/Mypage';
import ProductRegistration from './components/views/ProductRegistration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/product-registration" element={<ProductRegistration />} />
      </Routes>
    </Router>
  );
}

export default App;