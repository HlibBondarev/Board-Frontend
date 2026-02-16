import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";
import { AxiosError } from "axios";
import { arrayMove } from "@dnd-kit/sortable";

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

// Add MoveIssueDto interface
export interface MoveIssueDto {
  issueId: number;
  sourceColumnId: number;
  destinationColumnId: number;
  overId?: number | string; // ID of the item we dropped over
}

/**
 * Async Thunk to sync move with backend.
 * It retrieves the updated position from state after optimistic update.
 */
export const moveIssue = createAsyncThunk(
  "board/moveIssue",
  async (
    moveData: { issueId: number; columnId: number },
    { getState, rejectWithValue },
  ) => {
    try {
      // Cast state to access board data
      const state = getState() as { board: BoardState };

      // Find the target column in the updated local state
      const column = state.board.columns.find(
        (c) => c.id === moveData.columnId,
      );
      if (!column) return rejectWithValue("Column not found");

      // Find the issue to get its new calculated position
      const issue = column.issues.find((i) => i.id === moveData.issueId);
      if (!issue) return rejectWithValue("Issue not found");

      // Send the new position (index) to the server
      const response = await axiosInstance.patch(
        `/issues/${moveData.issueId}/move`,
        {
          columnId: moveData.columnId,
          position: issue.positionInColumn,
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(err.response?.data?.message || "Sync failed");
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
    /* Reducer for local state update (Drag and Drop logic) */
    /* FIX: Corrected optimistic reducer to handle overId and arrayMove */
    moveIssueOptimistic: (state, action: PayloadAction<MoveIssueDto>) => {
      const { issueId, sourceColumnId, destinationColumnId, overId } =
        action.payload;

      const sourceCol = state.columns.find((c) => c.id === sourceColumnId);
      const destCol = state.columns.find((c) => c.id === destinationColumnId);

      if (!sourceCol || !destCol) return;

      const activeIndex = sourceCol.issues.findIndex((i) => i.id === issueId);
      if (activeIndex === -1) return;

      // CASE 1: Moving within the same column
      if (sourceColumnId === destinationColumnId) {
        const overIndex = destCol.issues.findIndex(
          (i) => i.id === Number(overId),
        );
        if (overIndex !== -1 && activeIndex !== overIndex) {
          destCol.issues = arrayMove(destCol.issues, activeIndex, overIndex);
        }
      }
      // CASE 2: Moving between different columns
      else {
        const [movedIssue] = sourceCol.issues.splice(activeIndex, 1);
        movedIssue.columnId = destinationColumnId;

        const overIndex = destCol.issues.findIndex(
          (i) => i.id === Number(overId),
        );
        const newIndex = overIndex >= 0 ? overIndex : destCol.issues.length;

        destCol.issues.splice(newIndex, 0, movedIssue);
      }

      // CRITICAL: Update positionInColumn based on the new array order
      sourceCol.issues.forEach((issue, index) => {
        issue.positionInColumn = index;
      });

      if (sourceColumnId !== destinationColumnId) {
        destCol.issues.forEach((issue, index) => {
          issue.positionInColumn = index;
        });
      }
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

export const {
  setColumns,
  setFilterAssignee,
  clearFilter,
  moveIssueOptimistic,
} = boardSlice.actions;
export default boardSlice.reducer;
