import React, { useState, useRef } from 'react';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth"; // signOut 함수 추가
import { setDoc, doc, runTransaction } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { validatePassword } from '../utils/validation';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

const SignupForm = () => {
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSeller, setIsSeller] = useState(false);

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (!validatePassword(newPassword)) {
      setPasswordError('비밀번호는 8자 이상이어야 하며 대문자, 소문자, 숫자, 특수문자 중 적어도 3가지를 포함해야 합니다.');
    } else {
      setPasswordError('');
    }
  };

  const handleIsSellerChange = (e) => {
    setIsSeller(e.target.checked);
  };

  const signupMutation = useMutation({
    mutationFn: async () => {
      if (!validatePassword(password)) {
        throw new Error('비밀번호 조건을 충족하지 않습니다.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

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

      // 회원가입 후 자동 로그아웃 처리
      await signOut(auth);

      return userCredential;
    },
    onSuccess: () => {
      alert('회원가입이 완료되었습니다. 이제 로그인해 주세요.');

      setUsername('');
      setEmail('');
      setPassword('');

      // 로그인 페이지로 이동
      navigate('/login');
    },
    onError: (error) => {
      if (error.code === 'auth/email-already-in-use') {
        alert('이미 존재하는 이메일입니다.');
        emailInputRef.current.focus();
      } else {
        console.error(error);
        alert('회원가입 중 오류가 발생했습니다.');
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    signupMutation.mutate();
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
              ref={emailInputRef}
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
              disabled={signupMutation.isLoading}
            >
              {signupMutation.isLoading ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;