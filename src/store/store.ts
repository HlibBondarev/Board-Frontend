import { configureStore } from "@reduxjs/toolkit";
import boardReducer from "./board/boardSlice";
import projectReducer from "./board/projectSlice";
import authReducer from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    board: boardReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
