import { createStore, combineReducers } from 'redux';
import signupReducer from './reducers/signupReducer';
import authReducer from './reducers/authReducer';

const rootReducer = combineReducers({
    signup: signupReducer,
    auth: authReducer,    
});

const store = createStore(rootReducer);

export default store;