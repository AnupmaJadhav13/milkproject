import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import centerReducer from './slices/centerSlice';
import farmerReducer from './slices/farmerSlice';
import foodReducer from './slices/foodSlice';
import milkReducer from './slices/milkSlice';
import reportReducer from './slices/reportSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  centers: centerReducer,
  farmers: farmerReducer,
  food: foodReducer,
  milk: milkReducer,
  reports: reportReducer
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export const persistor = persistStore(store);
export default store;
