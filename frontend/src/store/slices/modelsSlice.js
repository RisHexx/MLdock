import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchModels = createAsyncThunk(
  'models/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/models');
      return response.data.models;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch models');
    }
  }
);

export const fetchModel = createAsyncThunk(
  'models/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/models/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch model');
    }
  }
);

export const uploadModel = createAsyncThunk(
  'models/upload',
  async ({ modelFile, metadataFile }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('model_file', modelFile);
      formData.append('metadata_file', metadataFile);

      const response = await api.post('/models/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Upload failed');
    }
  }
);

export const deleteModel = createAsyncThunk(
  'models/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/models/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete model');
    }
  }
);

export const toggleModelStatus = createAsyncThunk(
  'models/toggleStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/models/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update status');
    }
  }
);

const modelsSlice = createSlice({
  name: 'models',
  initialState: {
    items: [],
    currentModel: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    uploadStatus: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentModel: (state) => {
      state.currentModel = null;
    },
    resetUploadStatus: (state) => {
      state.uploadStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchModels
      .addCase(fetchModels.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // fetchModel
      .addCase(fetchModel.fulfilled, (state, action) => {
        state.currentModel = action.payload;
      })
      // uploadModel
      .addCase(uploadModel.pending, (state) => { state.uploadStatus = 'loading'; })
      .addCase(uploadModel.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        state.items.unshift(action.payload);
      })
      .addCase(uploadModel.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.error = action.payload;
      })
      // deleteModel
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.items = state.items.filter(m => m.id !== action.payload);
        if (state.currentModel?.id === action.payload) {
          state.currentModel = null;
        }
      })
      // toggleModelStatus
      .addCase(toggleModelStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentModel?.id === action.payload.id) {
          state.currentModel = action.payload;
        }
      });
  },
});

export const { clearCurrentModel, resetUploadStatus } = modelsSlice.actions;
export default modelsSlice.reducer;
