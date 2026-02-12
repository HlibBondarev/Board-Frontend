import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";
import { AxiosError } from "axios";

export interface Issue {
  id: number;
  title: string;
  description: string;
  dueDate?: string;
  createdAt: string;
  positionInColumn: number;
  columnId: number;
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
}

export interface Column {
  id: number;
  name: string;
  description: string;
  position: number;
  userId: string;
  UserDisplayName: string;
  issues: Issue[];
}

interface BoardState {
  columns: Column[];
  loading: boolean;
  error: string | null;
  // store ID for uniqueness, name for the UI label
  filterAssigneeId: string | null;
  filterAssigneeName: string | null;
}

const initialState: BoardState = {
  columns: [],
  loading: false,
  error: null,
  filterAssigneeId: null,
  filterAssigneeName: null,
};

// 1. Create an asynchronous Thunk to load data
export const fetchBoard = createAsyncThunk(
  "board/fetchBoard",
  async (_, { rejectWithValue }) => {
    try {
      // The endpoint must correspond to a controller in .NET (e.g., /column)
      const response = await axiosInstance.get<Column[]>("/columns");
      return response.data;
    } catch (error) {
      // Handle the error using AxiosError type instead of 'any'
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Failed to load board data",
      );
    }
  },
);

export interface CreateIssueDto {
  title: string;
  description: string;
  dueDate: string | null;
  columnId: number;
  positionInColumn: number;
  creatorId: string; // Required by your model
  createdAt: string; // Required by your model
}

export const createIssue = createAsyncThunk(
  "board/createIssue",
  async (newIssue: CreateIssueDto, { rejectWithValue }) => {
    try {
      // POST request to your .NET API (e.g., https://localhost:7283/api/issues)
      const response = await axiosInstance.post<Issue>("/issues", newIssue);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(err.response?.data?.message || "Error");
    }
  },
);

export const boardSlice = createSlice({
  name: "board",
  initialState: initialState,
  reducers: {
    // Reducer for manual state updates (e.g., after Drag-and-Drop)
    setColumns: (state, action: PayloadAction<Column[]>) => {
      state.columns = action.payload;
    },
    // Toggle logic using ID, but also saving Name for the UI badge
    setFilterAssignee: (
      state,
      action: PayloadAction<{ id: string; name: string } | null>,
    ) => {
      if (state.filterAssigneeId === action.payload?.id) {
        state.filterAssigneeId = null;
        state.filterAssigneeName = null;
      } else {
        state.filterAssigneeId = action.payload?.id || null;
        state.filterAssigneeName = action.payload?.name || null;
      }
    },
    // Separate reset for the top bar
    clearFilter: (state) => {
      state.filterAssigneeId = null;
      state.filterAssigneeName = null;
    },
  },
  // Handle all Thunk lifecycle states here
  extraReducers: (builder) => {
    builder
      /* --- Case for fetching the entire board --- */
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBoard.fulfilled,
        (state, action: PayloadAction<Column[]>) => {
          state.loading = false;
          state.columns = action.payload;
        },
      )
      .addCase(fetchBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* --- Case for creating a new issue (POST) --- */
      .addCase(createIssue.fulfilled, (state, action: PayloadAction<Issue>) => {
        // Find the column where the new issue belongs
        const column = state.columns.find(
          (c) => c.id === action.payload.columnId,
        );

        if (column) {
          // Ensure issues array exists before pushing
          if (!column.issues) {
            column.issues = [];
          }
          column.issues.push(action.payload);
        }
      });
  },
});

export const { setColumns, setFilterAssignee, clearFilter } =
  boardSlice.actions;
export default boardSlice.reducer;
