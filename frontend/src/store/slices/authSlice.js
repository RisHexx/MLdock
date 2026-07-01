import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const checkSetup = createAsyncThunk('auth/checkSetup', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/check');
    return response.data.is_setup;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to check setup');
  }
});

export const setupAdmin = createAsyncThunk('auth/setupAdmin', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/setup', { username, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Setup failed');
  }
});

export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
  }
});

const initialState = {
  isSetupComplete: null,
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // checkSetup
      .addCase(checkSetup.pending, (state) => { state.status = 'loading'; })
      .addCase(checkSetup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isSetupComplete = action.payload;
      })
      .addCase(checkSetup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // setupAdmin
      .addCase(setupAdmin.pending, (state) => { state.status = 'loading'; })
      .addCase(setupAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.isSetupComplete = true;
      })
      .addCase(setupAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // login
      .addCase(login.pending, (state) => { state.status = 'loading'; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // fetchUser
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
