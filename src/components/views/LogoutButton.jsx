import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const LogoutButton = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await signOut(auth);

      // 사용자 관련 모든 데이터를 무효화
      queryClient.invalidateQueries('user');
      queryClient.invalidateQueries('userData');

      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default LogoutButton;