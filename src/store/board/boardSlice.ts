import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  current,
  type UnknownAction,
  type SerializedError,
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

interface IssueDeleteResponse {
  columnId: number;
  issues: IssueDto[]; // Updated list of issues after deletion
}

export interface BoardWithIssuesDto {
  id: number;
  title: string;
  description: string;
  createdAt: number;
  userRole: "Admin" | "User";
  columns: ColumnDto[];
}

export interface ColumnDto {
  id: number;
  name: string;
  description: string;
  position: number;
  issues: IssueDto[];
}

interface BoardState {
  columns: ColumnDto[];
  title: string;
  userRole: "Admin" | "User" | null; // Track current user's role in this board
  previousColumns: ColumnDto[] | null; // Snapshot for rollback
  loading: boolean;
  error: string | null; // Added to track global board errors
  filterAssigneeId: string | null; // store ID for uniqueness,
  filterAssigneeName: string | null; // storename for the UI label
}

const initialState: BoardState = {
  columns: [],
  title: "",
  userRole: null,
  previousColumns: null,
  loading: false,
  error: null,
  filterAssigneeId: null,
  filterAssigneeName: null,
};

// Add CreateIssueDto interface for issue creation payload
export interface IssueCreateDto {
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

// Add UpdateIssueDto interface
export interface IssueUpdateDto {
  id: number | string;
  title: string;
  description: string;
  dueDate?: string | null;
  columnId: number;
  assigneeId?: string | undefined;
  assigneeName?: string | null;
}

// Add CreateColumnDto interface for column creation payload
export interface ColumnCreateUpdateDto {
  name: string;
  description: string;
}

export interface ColumnUpdateResponseDto {
  id: number;
  name: string;
  description: string;
}

// Define an interface for the input data
interface ColumnCreateArgs {
  boardId: number;
  newColumn: ColumnCreateUpdateDto;
}

interface ColumnUpdateArgs {
  id: number;
  updateColumn: ColumnCreateUpdateDto;
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
  async (payload: { id: number }, { rejectWithValue }) => {
    try {
      // GET request to .NET API (e.g., /boards/{id})
      const response = await axiosInstance.get<BoardWithIssuesDto>(
        `/boards/${payload.id}`, // Adjusted endpoint to fetch a specific board by ID
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Failed to load board data",
      );
    }
  },
);

// Async Thunk to create a new issue
export const createIssue = createAsyncThunk(
  "board/createIssue",
  async (newIssue: IssueCreateDto, { rejectWithValue }) => {
    try {
      // POST request to .NET API (e.g., /issues)
      const response = await axiosInstance.post<IssueDto>("/issues", newIssue);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Creation Issue failed",
      );
    }
  },
);

// Async Thunk to update an existing issue
export const updateIssue = createAsyncThunk(
  "board/updateIssue",
  async (updatedIssue: IssueUpdateDto, { rejectWithValue }) => {
    try {
      // PUT request to .NET API (e.g., /issues)
      const response = await axiosInstance.put<IssueDto>(
        "/issues",
        updatedIssue,
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Update Issue failed",
      );
    }
  },
);

// Async Thunk to delete an issue
export const deleteIssue = createAsyncThunk(
  "board/deleteIssue",
  async (payload: { id: number; columnId: number }, { rejectWithValue }) => {
    try {
      // DELETE request to .NET API (e.g., /issues/{id})
      const response = await axiosInstance.delete<IssueDeleteResponse>(
        `/issues/${payload.id}`,
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Delete Issue failed",
      );
    }
  },
);

// Async Thunk to sync move with backend.
// It retrieves the updated position from state after optimistic update.
export const moveIssue = createAsyncThunk(
  "board/moveIssue",
  async (
    moveData: { id: number; columnId: number },
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
      const issue = column.issues.find((i) => i.id === moveData.id);
      if (!issue) return rejectWithValue("Issue not found");

      // Send the new position (index) to the server
      // PATCH request to .NET API (e.g., /issues/{id}/move)
      const response = await axiosInstance.patch(
        `/issues/${moveData.id}/move`,
        {
          columnId: moveData.columnId,
          position: issue.positionInColumn,
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail ||
          "Error: Sync the board after moving the issue failed",
      );
    }
  },
);

export const addColumn = createAsyncThunk(
  "board/createColumn",
  // The first argument is our data object, the second is the thunkAPI (destructured)
  async ({ boardId, newColumn }: ColumnCreateArgs, { rejectWithValue }) => {
    try {
      // POST request to .NET API (e.g., /boards/{boardId}/columns)
      const response = await axiosInstance.post<ColumnDto>(
        `/boards/${boardId}/columns`,
        newColumn,
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Creation Column failed",
      );
    }
  },
);

// 1. Thunk to update Name and Description
export const updateColumn = createAsyncThunk(
  "board/updateColumn",
  async ({ id, updateColumn }: ColumnUpdateArgs, { rejectWithValue }) => {
    try {
      // PUT request to .NET API (e.g., /columns/{id})
      const response = await axiosInstance.put<ColumnUpdateResponseDto>(
        `/columns/${id}`,
        updateColumn,
      );
      return response.data; // Expected: updated Column object
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Update Column failed",
      );
    }
  },
);

// 2. Thunk to delete column
export const deleteColumn = createAsyncThunk(
  "board/deleteColumn",
  async (payload: { id: number }, { rejectWithValue }) => {
    try {
      // DELETE request to .NET API (e.g., /columns/{id})
      const response = await axiosInstance.delete<ColumnDto[]>(
        `/columns/${payload.id}`,
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Delete Column failed",
      );
    }
  },
);

export const boardSlice = createSlice({
  name: "board",
  initialState: initialState,
  reducers: {
    // // Reducer for manual state updates (e.g., after Drag-and-Drop)
    // setColumns: (state, action: PayloadAction<Column[]>) => {
    //   state.columns = action.payload;
    // },
    setUserRole: (state, action: PayloadAction<"Admin" | "User">) => {
      state.userRole = action.payload;
    },
    //Reducer to clear errors (can be dispatched on new interactions or after showing a Snackbar)
    resetBoard: (state) => {
      state.columns = [];
      state.loading = false;
      state.error = null;
      state.filterAssigneeName = null;
      state.filterAssigneeId = null;
    },
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
        (state, action: PayloadAction<BoardWithIssuesDto>) => {
          state.loading = false;
          state.columns = action.payload.columns;
          state.userRole = action.payload.userRole;
          state.title = action.payload.title;
        },
      )
      /* --- Issue Creation (Optimistic) --- */
      .addCase(createIssue.pending, (state, action) => {
        if (!state.previousColumns || state.previousColumns.length === 0) {
          state.previousColumns = current(state.columns);
        }
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
        if (!state.previousColumns || state.previousColumns.length === 0) {
          state.previousColumns = current(state.columns);
        }
        const updated = action.meta.arg;
        const column = state.columns.find((c) => c.id === updated.columnId);
        const issue = column?.issues.find((i) => i.id === updated.id);
        if (issue) {
          Object.assign(issue, { ...updated, isOptimistic: true });
        }
      })
      .addCase(updateIssue.fulfilled, (state, action) => {
        const { id, columnId } = action.payload;
        const column = state.columns.find((c) => c.id === columnId);
        const issue = column?.issues.find((i) => i.id === id);

        if (issue) {
          Object.assign(issue, action.payload, { isOptimistic: false });
        }
      })
      /* --- Issue Deletion (Optimistic) --- */
      .addCase(deleteIssue.pending, (state, action) => {
        if (!state.previousColumns || state.previousColumns.length === 0) {
          state.previousColumns = current(state.columns);
        }
        const { id, columnId } = action.meta.arg;
        const column = state.columns.find((c) => c.id === columnId);
        if (column) {
          column.issues = column.issues.filter((i) => i.id !== id);
        }
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        const { columnId, issues } = action.payload;
        const column = state.columns.find((c) => c.id === columnId);

        if (column) {
          column.issues = issues;
        }
      })
      /* --- Create Column --- */
      // })
      .addCase(addColumn.fulfilled, (state, action) => {
        state.columns.push({ ...action.payload, issues: [] });
      })
      /* --- Update Column --- */
      .addCase(updateColumn.fulfilled, (state, action) => {
        const index = state.columns.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.columns[index].name = action.payload.name;
          state.columns[index].description = action.payload.description;
        }
      })
      /* --- Delete Column --- */
      .addCase(deleteColumn.fulfilled, (state, action) => {
        state.columns = action.payload;
      })
      /* --- Universal Matchers for DRY Logic --- */
      // Handle all pending board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("board/") && action.type.endsWith("/pending"),
        (state) => {
          state.error = null; // Clear error on every new attempt
        },
      )
      // Handle all fulfilled board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("board/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.previousColumns = null; // Clear snapshot on success
          state.loading = false; // Global loading reset on any successful operation
        },
      )
      // Handle all rejected board actions (Global Rollback)
      .addMatcher(
        (action: UnknownAction): action is UnknownAction =>
          action.type.startsWith("board/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          if (state.previousColumns) {
            state.columns = state.previousColumns;
            state.previousColumns = null;
          }
          // Use SerializedError instead of any
          const serializedError = action.error as SerializedError;
          state.error =
            (action.payload as string) ||
            serializedError?.message ||
            "Operation failed";
        },
      );
  },
});

export const {
  clearError,
  setFilterAssignee,
  clearFilter,
  moveIssueOptimistic,
  resetBoard,
  setUserRole,
} = boardSlice.actions;

export default boardSlice.reducer;
