import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const email = useSelector(state => state.auth.email);
  const password = useSelector(state => state.auth.password);
  const [loginError, setLoginError] = useState(null);

  const handleEmailChange = (e) => {
    dispatch({ type: 'SET_EMAIL', payload: e.target.value });
  };

  const handlePasswordChange = (e) => {
    dispatch({ type: 'SET_PASSWORD', payload: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: userCredential.user });
      navigate('/');
    } catch (error) {
      setLoginError('Invalid email or password');
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>이메일:</label>
        <input type="email" value={email} onChange={handleEmailChange} />
      </div>
      <div>
        <label>비밀번호:</label>
        <input type="password" value={password} onChange={handlePasswordChange} />
      </div>
      {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
      <button type="submit">로그인</button>
    </form>
  );
};

export default LoginForm;