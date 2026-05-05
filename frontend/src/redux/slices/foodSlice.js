import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { foodApi } from '../../api/api';

export const fetchFoodRecords = createAsyncThunk('food/fetchFoodRecords', async ({ token, params }, thunkAPI) => {
  try {
    const response = await foodApi.getAll(token, params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load food records');
  }
});

export const createFoodRecord = createAsyncThunk('food/createFoodRecord', async ({ data, token }, thunkAPI) => {
  try {
    const response = await foodApi.add(data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create food record');
  }
});

export const updateFoodRecord = createAsyncThunk('food/updateFoodRecord', async ({ id, data, token }, thunkAPI) => {
  try {
    const response = await foodApi.update(id, data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update food record');
  }
});

export const deleteFoodRecord = createAsyncThunk('food/deleteFoodRecord', async ({ id, token }, thunkAPI) => {
  try {
    await foodApi.remove(id, token);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete food record');
  }
});

export const fetchFoodRecordsByCenter = createAsyncThunk('food/fetchFoodRecordsByCenter', async ({ centerId, token, params }, thunkAPI) => {
  try {
    const response = await foodApi.getByCenter(centerId, token, params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load food records by center');
  }
});

export const fetchFoodRecordsByFarmer = createAsyncThunk('food/fetchFoodRecordsByFarmer', async ({ farmerId, token }, thunkAPI) => {
  try {
    const response = await foodApi.getByFarmer(farmerId, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load food records by farmer');
  }
});

export const fetchMonthlyReports = createAsyncThunk('food/fetchMonthlyReports', async ({ token, params }, thunkAPI) => {
  try {
    const response = await foodApi.getMonthlyReports(token, params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load monthly reports');
  }
});

const foodSlice = createSlice({
  name: 'food',
  initialState: {
    records: [],
    reports: [],
    status: 'idle',
    error: null,
    totalPages: 0,
    currentPage: 1,
    total: 0
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFoodRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFoodRecords.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records = action.payload.foodRecords;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchFoodRecords.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createFoodRecord.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createFoodRecord.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records.unshift(action.payload);
      })
      .addCase(createFoodRecord.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateFoodRecord.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateFoodRecord.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.records.findIndex(record => record._id === action.payload._id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
      })
      .addCase(updateFoodRecord.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteFoodRecord.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteFoodRecord.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records = state.records.filter(record => record._id !== action.payload);
      })
      .addCase(deleteFoodRecord.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFoodRecordsByCenter.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFoodRecordsByCenter.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records = action.payload.foodRecords;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.total = action.payload.total;
      })
      .addCase(fetchFoodRecordsByCenter.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchFoodRecordsByFarmer.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFoodRecordsByFarmer.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records = action.payload;
      })
      .addCase(fetchFoodRecordsByFarmer.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMonthlyReports.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMonthlyReports.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reports = action.payload;
      })
      .addCase(fetchMonthlyReports.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { clearError } = foodSlice.actions;
export default foodSlice.reducer;