const initialState = {
    username: '',
    email: '',
    password: ''
  };
  
  const signupReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_USERNAME':
        return { ...state, username: action.payload };
      case 'SET_EMAIL':
        return { ...state, email: action.payload };
      case 'SET_PASSWORD':
        return { ...state, password: action.payload };
      default:
        return state;
    }
  };
  
  export default signupReducer;