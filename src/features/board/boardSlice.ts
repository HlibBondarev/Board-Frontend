import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Issue {
  id: number;
  title: string;
  description: string;
  dueDate?: string;
  createdAt: string;
  positionInColumn: number;
  columnId: number;
  creatorId: string;
  assigneeId?: string;
}

export interface Column {
  id: number;
  name: string;
  description: string;
  position: number;
  userId: string;
  issues: Issue[];
}

interface BoardState {
  columns: Column[];
  loading: boolean;
  error: string | null;
}

const initialState: BoardState = {
  columns: [],
  loading: false,
  error: null,
};

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    setColumns: (state, action: PayloadAction<Column[]>) => {
      state.columns = action.payload;
    },
  },
});

export const { setColumns } = boardSlice.actions;
export default boardSlice.reducer;
