import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { farmerDashboardApi } from '../../api/api';

export const fetchFarmerMilk = createAsyncThunk(
  'farmerDashboard/fetchMilk',
  async ({ token, params }, thunkAPI) => {
    try {
      const res = await farmerDashboardApi.getMilk(token, params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchFarmerFood = createAsyncThunk(
  'farmerDashboard/fetchFood',
  async ({ token, params }, thunkAPI) => {
    try {
      const res = await farmerDashboardApi.getFood(token, params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchFarmerReport = createAsyncThunk(
  'farmerDashboard/fetchReport',
  async ({ token, params }, thunkAPI) => {
    try {
      const res = await farmerDashboardApi.getReport(token, params);
      return res.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

const farmerDashboardSlice = createSlice({
  name: 'farmerDashboard',
  initialState: {
    milk: { data: [], summary: {}, total: 0, totalPages: 1, currentPage: 1 },
    food: { data: [], summary: {}, total: 0, totalPages: 1, currentPage: 1 },
    report: { data: [], summary: {}, fromDate: null, toDate: null },
    milkStatus: 'idle',
    foodStatus: 'idle',
    reportStatus: 'idle',
    error: null
  },
  reducers: {
    clearFarmerDashboard: (state) => {
      state.milk = { data: [], summary: {}, total: 0, totalPages: 1, currentPage: 1 };
      state.food = { data: [], summary: {}, total: 0, totalPages: 1, currentPage: 1 };
      state.report = { data: [], summary: {}, fromDate: null, toDate: null };
      state.milkStatus = 'idle';
      state.foodStatus = 'idle';
      state.reportStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarmerMilk.pending, (state) => { state.milkStatus = 'loading'; state.error = null; })
      .addCase(fetchFarmerMilk.fulfilled, (state, action) => {
        state.milkStatus = 'succeeded';
        state.milk = {
          data: action.payload.data || [],
          summary: action.payload.summary || {},
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1
        };
      })
      .addCase(fetchFarmerMilk.rejected, (state, action) => { state.milkStatus = 'failed'; state.error = action.payload; })

      .addCase(fetchFarmerFood.pending, (state) => { state.foodStatus = 'loading'; state.error = null; })
      .addCase(fetchFarmerFood.fulfilled, (state, action) => {
        state.foodStatus = 'succeeded';
        state.food = {
          data: action.payload.data || [],
          summary: action.payload.summary || {},
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 1,
          currentPage: action.payload.currentPage || 1
        };
      })
      .addCase(fetchFarmerFood.rejected, (state, action) => { state.foodStatus = 'failed'; state.error = action.payload; })

      .addCase(fetchFarmerReport.pending, (state) => { state.reportStatus = 'loading'; state.error = null; })
      .addCase(fetchFarmerReport.fulfilled, (state, action) => {
        state.reportStatus = 'succeeded';
        state.report = {
          data: action.payload.data || [],
          summary: action.payload.summary || {},
          fromDate: action.payload.fromDate,
          toDate: action.payload.toDate
        };
      })
      .addCase(fetchFarmerReport.rejected, (state, action) => { state.reportStatus = 'failed'; state.error = action.payload; });
  }
});

export const { clearFarmerDashboard } = farmerDashboardSlice.actions;
export default farmerDashboardSlice.reducer;
