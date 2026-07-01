import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchApiKeys = createAsyncThunk(
  'apiKeys/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api-keys');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch API keys');
    }
  }
);

export const generateApiKey = createAsyncThunk(
  'apiKeys/generate',
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post('/api-keys', { name });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to generate API key');
    }
  }
);

export const revokeApiKey = createAsyncThunk(
  'apiKeys/revoke',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api-keys/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to revoke API key');
    }
  }
);

const apiKeysSlice = createSlice({
  name: 'apiKeys',
  initialState: {
    items: [],
    newKey: null, // Stores the newly generated full key
    status: 'idle',
    error: null,
  },
  reducers: {
    clearNewKey: (state) => {
      state.newKey = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchApiKeys
      .addCase(fetchApiKeys.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // generateApiKey
      .addCase(generateApiKey.fulfilled, (state, action) => {
        state.newKey = action.payload;
        // Also add it to the items list (it has the same fields plus the full key)
        state.items.unshift({
          id: action.payload.id,
          name: action.payload.name,
          key_prefix: action.payload.key_prefix,
          is_active: true,
          created_at: action.payload.created_at,
        });
      })
      // revokeApiKey
      .addCase(revokeApiKey.fulfilled, (state, action) => {
        state.items = state.items.filter(k => k.id !== action.payload);
      });
  },
});

export const { clearNewKey } = apiKeysSlice.actions;
export default apiKeysSlice.reducer;
