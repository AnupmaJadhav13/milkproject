import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { centerApi } from '../../api/api';

export const fetchCenters = createAsyncThunk('centers/fetchCenters', async (token, thunkAPI) => {
  try {
    const response = await centerApi.getAll(token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load centers');
  }
});

export const createCenter = createAsyncThunk('centers/createCenter', async ({ data, token }, thunkAPI) => {
  try {
    const response = await centerApi.add(data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create center');
  }
});

export const updateCenter = createAsyncThunk('centers/updateCenter', async ({ id, data, token }, thunkAPI) => {
  try {
    const response = await centerApi.update(id, data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update center');
  }
});

export const deleteCenter = createAsyncThunk('centers/deleteCenter', async ({ id, token }, thunkAPI) => {
  try {
    await centerApi.remove(id, token);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete center');
  }
});

const centerSlice = createSlice({
  name: 'centers',
  initialState: {
    list: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCenters.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCenters.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchCenters.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createCenter.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateCenter.fulfilled, (state, action) => {
        state.list = state.list.map((center) => (center._id === action.payload._id ? action.payload : center));
      })
      .addCase(deleteCenter.fulfilled, (state, action) => {
        state.list = state.list.filter((center) => center._id !== action.payload);
      });
  }
});

export default centerSlice.reducer;
