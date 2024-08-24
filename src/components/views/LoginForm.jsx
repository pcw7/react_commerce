import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useMutation, useQueryClient } from '@tanstack/react-query';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "User", userCredential.user.uid));
      if (userDoc.exists()) {
        return { user: userCredential.user, userData: userDoc.data() };
      } else {
        throw new Error("User data not found");
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData('user', { ...data.user, userId: data.userData.userId });
      queryClient.setQueryData('userData', data.userData);
      navigate('/');
    },
    onError: (error) => {
      setLoginError('Invalid email or password');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
        <div className="text-left mb-8">
          <h1 className="text-4xl font-bold">SHOP</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          {loginError && <p className="text-red-500 text-xs italic mb-4">{loginError}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              로그인
            </button>
          </div>
        </form>
        <div className="text-right mt-4">
          <a href="/signup" className="text-sm text-orange-500 hover:text-orange-700">회원가입</a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;