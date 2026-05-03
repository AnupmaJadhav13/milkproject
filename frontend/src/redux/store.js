import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import centerReducer from './slices/centerSlice';
import farmerReducer from './slices/farmerSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    centers: centerReducer,
    farmers: farmerReducer
  }
});

export default store;
