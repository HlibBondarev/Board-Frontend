import { configureStore } from "@reduxjs/toolkit";
import boardReducer from "../features/board/boardSlice";
import authReducer from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    board: boardReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
