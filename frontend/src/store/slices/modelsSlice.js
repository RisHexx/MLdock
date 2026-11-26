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

// Must match backend settings.MAX_MODEL_SIZE_MB
export const MAX_MODEL_SIZE_MB = Number(import.meta.env.VITE_MAX_MODEL_SIZE_MB) || 200;

const getUploadErrorMessage = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  if (status === 413) {
    return `Model file is too large. Maximum allowed size is ${MAX_MODEL_SIZE_MB} MB.`;
  }
  if (typeof detail === 'string') return detail;
  // FastAPI validation errors (422) come back as an array of { msg, loc, ... }
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
  }
  if (!error.response) {
    return 'Network error: the upload was interrupted or the server is unreachable.';
  }
  return `Upload failed (HTTP ${status})`;
};

export const uploadModel = createAsyncThunk(
  'models/upload',
  async ({ modelFile, metadataFile, onProgress }, { rejectWithValue }) => {
    if (modelFile.size > MAX_MODEL_SIZE_MB * 1024 * 1024) {
      return rejectWithValue(
        `Model file is ${(modelFile.size / (1024 * 1024)).toFixed(1)} MB, exceeds limit of ${MAX_MODEL_SIZE_MB} MB`
      );
    }
    try {
      const formData = new FormData();
      formData.append('model_file', modelFile);
      formData.append('metadata_file', metadataFile);

      const response = await api.post('/models/upload', formData, {
        // Keep this: the axios instance defaults to application/json, which would
        // make axios serialize the FormData to JSON. Axios fills in the boundary.
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 0, // large uploads can take a while
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(getUploadErrorMessage(error));
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
