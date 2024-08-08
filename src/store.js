import { createStore, combineReducers } from 'redux';
import signupReducer from './reducers/signupReducer';

const rootReducer = combineReducers({
    signup: signupReducer,
    // 여기에 다른 리듀서를 추가할 수 있습니다.
});

const store = createStore(rootReducer);

export default store;