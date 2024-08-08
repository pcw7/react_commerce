const initialState = {
    email: '',
    password: '',
    isAuthenticated: false,
    user: null,
    error: null
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
      case 'LOGOUT':
        return { ...state, isAuthenticated: false, user: null, email: '', password: '', error: null };
      default:
        return state;
    }
  };
  
  export default authReducer;