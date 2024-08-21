import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, runTransaction } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { validatePassword } from '../utils/validation';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const dispatch = useDispatch();
  const username = useSelector(state => state.signup.username);
  const email = useSelector(state => state.signup.email);
  const password = useSelector(state => state.signup.password);
  const navigate = useNavigate();

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

      const userId = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'Counters', 'userCounter');
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists()) {
          throw new Error('Counter document does not exist!');
        }
        const newUserNumber = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newUserNumber });
        return newUserNumber;
      });

      await setDoc(doc(db, "User", userCredential.user.uid), {
        userId,
        username: username,
        email: email,
        isSeller: isSeller,
      });

      // 회원가입 완료 알림창
      alert('회원가입이 완료되었습니다.');

      // Redux 상태 초기화
      dispatch({ type: 'SET_USERNAME', payload: '' });
      dispatch({ type: 'SET_EMAIL', payload: '' });
      dispatch({ type: 'SET_PASSWORD', payload: '' });

      // 로그인 페이지로 이동
      navigate('/login');

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-3xl font-semibold text-center mb-6">회원가입</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">이름</label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {passwordError && (
              <p className="text-red-500 text-xs italic mt-2">{passwordError}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">판매자 여부</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSeller}
                onChange={handleIsSellerChange}
                className="mr-2 leading-tight"
              />
              <span className="text-sm">판매자</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;