import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import modelsReducer from './slices/modelsSlice';
import apiKeysReducer from './slices/apiKeysSlice';
import logsReducer from './slices/logsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    models: modelsReducer,
    apiKeys: apiKeysReducer,
    logs: logsReducer,
  },
});
