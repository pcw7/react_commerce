import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore"; 
import { auth, db } from "../../firebase";
import { validatePassword } from '../utils/validation';

const SignupForm = () => {
  const dispatch = useDispatch();
  const username = useSelector(state => state.signup.username);
  const email = useSelector(state => state.signup.email);
  const password = useSelector(state => state.signup.password);

  const [passwordError, setPasswordError] = useState('');
  const [isSeller, setIsSeller] = useState(false);

  const handleUsernameChange = (e) => {
    dispatch({ type: 'SET_USERNAME', payload: e.target.value });
  };

  const handleEmailChange = (e) => {
    dispatch({ type: 'SET_EMAIL', payload: e.target.value });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    dispatch({ type: 'SET_PASSWORD', payload: newPassword });

    if (!validatePassword(newPassword)) {
      setPasswordError('비밀번호는 8자 이상이어야 하며 대문자, 소문자, 숫자, 특수문자 중 적어도 3가지를 포함해야 합니다.');
    } else {
      setPasswordError('');
    }
  };

  const handleIsSellerChange = (e) => {
    setIsSeller(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      setPasswordError('비밀번호 조건을 충족하지 않습니다. 비밀번호를 다시 입력해주세요.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(userCredential);
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: username,
        email: email,
        isSeller: isSeller,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>이름:</label>
        <input type="text" value={username} onChange={handleUsernameChange} />
      </div>
      <div>
        <label>이메일:</label>
        <input type="email" value={email} onChange={handleEmailChange} />
      </div>
      <div>
        <label>비밀번호:</label>
        <input type="password" value={password} onChange={handlePasswordChange} />
        {passwordError && <p style={{ color: 'red' }}>{passwordError}</p>}
      </div>
      <div>
        <label>판매자 등록:</label>
        <input type="checkbox" checked={isSeller} onChange={handleIsSellerChange} />
      </div>
      <button type="submit">회원가입</button>
    </form>
  );
};

export default SignupForm;