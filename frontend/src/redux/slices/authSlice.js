import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi, apiBaseUrl } from '../../api/api';

const storedUser = null;

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, thunkAPI) => {
  try {
    const response = await authApi.login(credentials);
    return response.data;
  } catch (error) {
    const rawMessage =
      error?.response?.data?.message ||
      (typeof error?.message === 'string' ? error.message : null) ||
      '';
    const isNetworkIssue =
      !error?.response ||
      /network error|timeout|socket|failed to fetch|request failed/i.test(rawMessage);
    const errorMessage =
      (isNetworkIssue && `Network error: unable to reach server at ${apiBaseUrl}. Make sure backend is running and phone + laptop are on same Wi-Fi.`) ||
      rawMessage ||
      JSON.stringify(error) ||
      'Login failed';
    return thunkAPI.rejectWithValue(errorMessage);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedUser?.token || null,
    status: 'idle',
    error: null
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    updateUserInfo(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { logout, updateUserInfo } = authSlice.actions;
export default authSlice.reducer;
