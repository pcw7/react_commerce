const initialState = {
    email: '',
    password: '',
    isAuthenticated: false,
    user: null,
    isSeller: false,
    error: null,
    userId: null,
  };
  
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_EMAIL':
        return { ...state, email: action.payload };
      case 'SET_PASSWORD':
        return { ...state, password: action.payload };
      case 'LOGIN_SUCCESS':
        return { ...state, isAuthenticated: true, user: action.payload, error: null };
      case 'LOGIN_FAILURE':
        return { ...state, isAuthenticated: false, error: action.payload };
      case 'SET_USER_DATA':
        return { ...state, isSeller: action.payload.isSeller, userId: action.payload.userId };
      case 'LOGOUT':
        return { ...state, isAuthenticated: false, user: null, email: '', password: '', error: null };
      default:
        return state;
    }
  };
  
  export default authReducer;