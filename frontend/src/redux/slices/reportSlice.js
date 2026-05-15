import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reportApi } from '../../api/api';

export const fetchCenterReport = createAsyncThunk(
  'reports/fetchCenterReport',
  async ({ centerId, token, params }, thunkAPI) => {
    try {
      const res = await reportApi.getCenterReport(centerId, token, params);
      return res.data.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchFarmerReport = createAsyncThunk(
  'reports/fetchFarmerReport',
  async ({ farmerId, token, params }, thunkAPI) => {
    try {
      const res = await reportApi.getFarmerReport(farmerId, token, params);
      return res.data.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchAllCentersSummary = createAsyncThunk(
  'reports/fetchAllCentersSummary',
  async ({ token, params }, thunkAPI) => {
    try {
      const res = await reportApi.getAllCentersSummary(token, params);
      return res.data.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchFarmerAnalytics = createAsyncThunk(
  'reports/fetchFarmerAnalytics',
  async ({ farmerId, token }, thunkAPI) => {
    try {
      const res = await reportApi.getFarmerAnalytics(farmerId, token);
      return res.data.data;
    } catch (e) {
      return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

const reportSlice = createSlice({
  name: 'reports',
  initialState: {
    centerReport: null,
    farmerReport: null,
    allCentersSummary: null,
    farmerAnalytics: null,
    status: 'idle',
    error: null
  },
  reducers: {
    clearReports: (state) => {
      state.centerReport = null;
      state.farmerReport = null;
      state.allCentersSummary = null;
      state.farmerAnalytics = null;
      state.error = null;
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.status = 'loading'; state.error = null; };
    const rejected = (state, action) => { state.status = 'failed'; state.error = action.payload; };

    builder
      .addCase(fetchCenterReport.pending, pending)
      .addCase(fetchCenterReport.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.centerReport = action.payload;
      })
      .addCase(fetchCenterReport.rejected, rejected)

      .addCase(fetchFarmerReport.pending, pending)
      .addCase(fetchFarmerReport.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.farmerReport = action.payload;
      })
      .addCase(fetchFarmerReport.rejected, rejected)

      .addCase(fetchAllCentersSummary.pending, pending)
      .addCase(fetchAllCentersSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allCentersSummary = action.payload;
      })
      .addCase(fetchAllCentersSummary.rejected, rejected)

      .addCase(fetchFarmerAnalytics.pending, pending)
      .addCase(fetchFarmerAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.farmerAnalytics = action.payload;
      })
      .addCase(fetchFarmerAnalytics.rejected, rejected);
  }
});

export const { clearReports } = reportSlice.actions;
export default reportSlice.reducer;
