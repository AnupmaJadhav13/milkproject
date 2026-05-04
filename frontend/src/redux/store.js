import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import centerReducer from './slices/centerSlice';
import farmerReducer from './slices/farmerSlice';
import foodReducer from './slices/foodSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    centers: centerReducer,
    farmers: farmerReducer,
    food: foodReducer
  }
});

export default store;
