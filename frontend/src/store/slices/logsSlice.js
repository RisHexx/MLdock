import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchLogs = createAsyncThunk(
  'logs/fetchAll',
  async ({ page = 1, limit = 50, model_name = null }, { rejectWithValue }) => {
    try {
      let url = `/logs?page=${page}&limit=${limit}`;
      if (model_name) url += `&model_name=${model_name}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch logs');
    }
  }
);

const logsSlice = createSlice({
  name: 'logs',
  initialState: {
    items: [],
    total: 0,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.logs;
        state.total = action.payload.total;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default logsSlice.reducer;
