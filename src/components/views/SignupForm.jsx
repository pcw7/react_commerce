import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";

const SignupForm = () => {
  const dispatch = useDispatch();
  const username = useSelector(state => state.signup.username);
  const email = useSelector(state => state.signup.email);
  const password = useSelector(state => state.signup.password);

  const handleUsernameChange = (e) => {
    dispatch({ type: 'SET_USERNAME', payload: e.target.value });
  };

  const handleEmailChange = (e) => {
    dispatch({ type: 'SET_EMAIL', payload: e.target.value });
  };

  const handlePasswordChange = (e) => {
    dispatch({ type: 'SET_PASSWORD', payload: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(userCredential);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input type="text" value={username} onChange={handleUsernameChange} />
      </div>
      <div>
        <label>Email:</label>
        <input type="email" value={email} onChange={handleEmailChange} />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" value={password} onChange={handlePasswordChange} />
      </div>
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default SignupForm;