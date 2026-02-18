import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  current,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";
import { AxiosError } from "axios";
import { arrayMove } from "@dnd-kit/sortable";

export interface IssueDto {
  id: number | string;
  title: string;
  description: string;
  dueDate?: string;
  columnId: number;
  positionInColumn: number;
  createdAt: string;
  creatorId: string;
  assigneeId?: string;
  creatorName: string;
  assigneeName?: string;
  isOptimistic?: boolean; // Flag to identify issues created or updated during optimistic updates
}

export interface Column {
  id: number;
  name: string;
  description: string;
  position: number;
  userId: string;
  UserDisplayName: string;
  issues: IssueDto[];
}

interface BoardState {
  columns: Column[];
  previousColumns: Column[] | null; // Snapshot for rollback
  loading: boolean;
  error: string | null; // Added to track global board errors
  filterAssigneeId: string | null; // store ID for uniqueness,
  filterAssigneeName: string | null; // storename for the UI label
}

const initialState: BoardState = {
  columns: [],
  previousColumns: null,
  loading: false,
  error: null,
  filterAssigneeId: null,
  filterAssigneeName: null,
};

export interface CreateIssueDto {
  tempId: string; // Add this for tracking during optimistic updates
  title: string;
  description: string;
  dueDate?: string | null;
  columnId: number;
  positionInColumn: number;
  createdAt: string;
  creatorId: string;
  assigneeId?: string | undefined;
  creatorName: string | null;
  assigneeName?: string | null;
}

export interface UpdateIssueDto {
  id: number | string;
  title: string;
  description: string;
  dueDate?: string | null;
  columnId: number;
  //positionInColumn: number;
  // creatorId: string;
  // assigneeId?: string;
  //assigneeName?: string | null;
}

// Add MoveIssueDto interface
export interface MoveIssueDto {
  issueId: number;
  sourceColumnId: number;
  destinationColumnId: number;
  overId?: number | string; // ID of the item we dropped over
}

// Async Thunk to load data
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

// Async Thunk to create a new issue
export const createIssue = createAsyncThunk(
  "board/createIssue",
  async (newIssue: CreateIssueDto, { rejectWithValue }) => {
    try {
      // POST request to .NET API (e.g., https://localhost:7283/api/issues)
      const response = await axiosInstance.post<IssueDto>("/issues", newIssue);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Error: Creation Issue failed",
      );
    }
  },
);

// Async Thunk to update an existing issue
export const updateIssue = createAsyncThunk(
  "board/updateIssue",
  async (updatedIssue: UpdateIssueDto, { rejectWithValue }) => {
    try {
      // PUT request to .NET API (e.g., https://localhost:7283/api/issues/{id})
      const response = await axiosInstance.put<IssueDto>(
        `/issues/${updatedIssue.id}`,
        updatedIssue,
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Error: Update Issue failed",
      );
    }
  },
);

// Async Thunk to delete an issue
export const deleteIssue = createAsyncThunk(
  "board/deleteIssue",
  async (
    payload: { id: string | number; columnId: number },
    { rejectWithValue },
  ) => {
    try {
      await axiosInstance.delete(`/issues/${payload.id}`);
      return payload;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      return rejectWithValue(
        err.response?.data?.message || "Error: Delete failed",
      );
    }
  },
);

// Async Thunk to sync move with backend.
// It retrieves the updated position from state after optimistic update.
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
    // Reducer to clear errors (can be dispatched on new interactions or after showing a Snackbar)
    clearError: (state) => {
      state.error = null;
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
      // Create a snapshot ONLY if it doesn't exist yet (first move in drag session)
      if (!state.previousColumns) {
        state.previousColumns = current(state.columns);
      }
      // Clear previous errors on new interaction
      state.error = null;

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
      /* --- Board Fetching --- */
      .addCase(fetchBoard.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchBoard.fulfilled,
        (state, action: PayloadAction<Column[]>) => {
          state.loading = false;
          state.columns = action.payload;
        },
      )

      /* --- Issue Creation (Optimistic) --- */
      .addCase(createIssue.pending, (state, action) => {
        state.previousColumns = current(state.columns);
        const dto = action.meta.arg;
        const column = state.columns.find((c) => c.id === dto.columnId);
        if (column) {
          if (!column.issues) column.issues = [];
          column.issues.push({
            ...dto,
            id: dto.tempId, // Use tempId for React keys before server response
            creatorName: dto.creatorName || "",
            assigneeName: dto.assigneeName || null,
            isOptimistic: true,
          } as IssueDto);
        }
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        const tempId = action.meta.arg.tempId;
        const column = state.columns.find(
          (c) => c.id === action.payload.columnId,
        );
        if (column?.issues) {
          const index = column.issues.findIndex((i) => i.id === tempId);
          if (index !== -1) {
            // Replace temp issue with the real one from server
            column.issues[index] = { ...action.payload, isOptimistic: false };
          }
        }
      })

      /* --- Issue Updating (Optimistic) --- */
      .addCase(updateIssue.pending, (state, action) => {
        const updated = action.meta.arg;
        const column = state.columns.find((c) => c.id === updated.columnId);
        const issue = column?.issues.find((i) => i.id === updated.id);
        if (issue) {
          Object.assign(issue, { ...updated, isOptimistic: true });
        }
      })

      /* --- Issue Deletion (Optimistic) --- */
      .addCase(deleteIssue.pending, (state, action) => {
        const { id, columnId } = action.meta.arg;
        const column = state.columns.find((c) => c.id === columnId);
        if (column) {
          column.issues = column.issues.filter((i) => i.id !== id);
        }
      })

      /* --- Universal Matchers for DRY Logic --- */

      // Handle all pending board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("board/") && action.type.endsWith("/pending"),
        (state /* , action */) => {
          state.error = null; // Clear error on every new attempt

          // // Take a snapshot for rollback (skip for fetchBoard to avoid overwriting state with current)
          // if (
          //   action.type !== fetchBoard.pending.type &&
          //   action.type !== moveIssue.pending.type // We handle snapshot in moveIssueOptimistic
          // ) {
          //   state.previousColumns = current(state.columns);
          // }
        },
      )
      // Handle all fulfilled board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("board/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.previousColumns = null; // Clear snapshot on success
        },
      )
      // Handle all rejected board actions (Global Rollback)
      .addMatcher(
        (action) =>
          action.type.startsWith("board/") && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          state.loading = false;

          // Automatic rollback to the state before the failed operation
          if (state.previousColumns) {
            state.columns = state.previousColumns;
            state.previousColumns = null;
          }

          // Set error message from payload or generic fallback
          state.error = action.payload || "Operation failed";
        },
      );
  },
});

export const {
  setColumns,
  clearError,
  setFilterAssignee,
  clearFilter,
  moveIssueOptimistic,
} = boardSlice.actions;

export default boardSlice.reducer;
