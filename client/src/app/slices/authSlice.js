import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: localStorage.getItem("theme") || "business",
  isLoggedIn: false,
  isLoading: false,
  user: null,
  isMobile: window.innerWidth < 640,
  isChecked: localStorage.getItem("theme") === "business",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
    setIsLoggedIn(state, action) {
      state.isLoggedIn = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    setIsMobile(state, action) {
      state.isMobile = action.payload;
    },
    setIsChecked(state, action) {
      state.isChecked = action.payload;
    },
  },
});

export const {
  setIsLoading,
  setIsLoggedIn,
  setUser,
  setTheme,
  setIsMobile,
  setIsChecked,
} = authSlice.actions;

export default authSlice.reducer;
