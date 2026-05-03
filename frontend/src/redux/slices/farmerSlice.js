import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { farmerApi } from '../../api/api';

export const fetchFarmers = createAsyncThunk('farmers/fetchFarmers', async ({ token, params }, thunkAPI) => {
  try {
    const response = await farmerApi.getAll(token, params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load farmers');
  }
});

export const createFarmer = createAsyncThunk('farmers/createFarmer', async ({ data, token }, thunkAPI) => {
  try {
    const response = await farmerApi.add(data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create farmer');
  }
});

export const updateFarmer = createAsyncThunk('farmers/updateFarmer', async ({ id, data, token }, thunkAPI) => {
  try {
    const response = await farmerApi.update(id, data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update farmer');
  }
});

export const deleteFarmer = createAsyncThunk('farmers/deleteFarmer', async ({ id, token }, thunkAPI) => {
  try {
    await farmerApi.remove(id, token);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete farmer');
  }
});

const farmerSlice = createSlice({
  name: 'farmers',
  initialState: {
    list: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarmers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFarmers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchFarmers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createFarmer.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateFarmer.fulfilled, (state, action) => {
        state.list = state.list.map((farmer) => (farmer._id === action.payload._id ? action.payload : farmer));
      })
      .addCase(deleteFarmer.fulfilled, (state, action) => {
        state.list = state.list.filter((farmer) => farmer._id !== action.payload);
      });
  }
});

export default farmerSlice.reducer;
