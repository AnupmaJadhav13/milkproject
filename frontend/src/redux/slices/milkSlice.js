import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { milkApi } from '../../api/api';

export const createMilkEntry = createAsyncThunk('milk/createMilkEntry', async ({ data, token }, thunkAPI) => {
  try {
    const response = await milkApi.add(data, token);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to save milk entry');
  }
});

export const fetchMilkEntries = createAsyncThunk('milk/fetchMilkEntries', async ({ token, params }, thunkAPI) => {
  try {
    const response = await milkApi.getAll(token, params);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load collection records');
  }
});

const milkSlice = createSlice({
  name: 'milk',
  initialState: {
    entries: [],
    summary: {
      totalMilkLiters: 0,
      totalAmountInr: 0,
      cowMilkLiters: 0,
      buffaloMilkLiters: 0,
      morningMilkLiters: 0,
      eveningMilkLiters: 0
    },
    total: 0,
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createMilkEntry.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createMilkEntry.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.entries.unshift(action.payload);
      })
      .addCase(createMilkEntry.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMilkEntries.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMilkEntries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        console.log('=== REDUX MILK ENTRIES FULFILLED ===');
        console.log('Full payload:', JSON.stringify(action.payload, null, 2));
        console.log('Summary received:', action.payload.summary);
        console.log('====================================');
        state.entries = action.payload.entries || [];
        state.summary = action.payload.summary || {
          totalMilkLiters: 0,
          totalAmountInr: 0,
          cowMilkLiters: 0,
          buffaloMilkLiters: 0,
          morningMilkLiters: 0,
          eveningMilkLiters: 0
        };
        state.total = action.payload.total || 0;
      })
      .addCase(fetchMilkEntries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default milkSlice.reducer;
