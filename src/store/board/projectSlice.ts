import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
  //   current,
} from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";
import { AxiosError } from "axios";

// --- INTERFACES ---

export interface BoardDto {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  role: "Admin" | "User";
}

export interface CreateBoardDto {
  title: string;
  description: string;
  userId: string;
}

// Interface for adding a user to a specific board
export interface AddUserToBoardDto {
  boardId: number;
  email: string;
  role: "Admin" | "User";
}

interface ProjectsState {
  boards: BoardDto[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  boards: [],
  loading: false,
  error: null,
};

export const fetchBoardsByUser = createAsyncThunk(
  "project/fetchBoardsByUser",
  async (payload: { userId: string | undefined }, { rejectWithValue }) => {
    try {
      // The endpoint must correspond to a controller in .NET (e.g., /column)
      const response = await axiosInstance.get<BoardDto[]>(`/boards`, {
        params: { userId: payload.userId },
      });
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail ||
          "Error: Failed to load boards data for user",
      );
    }
  },
);

export const createBoard = createAsyncThunk(
  "project/createBoard",
  async (newBoard: CreateBoardDto, { rejectWithValue }) => {
    try {
      // POST request to .NET API (e.g., https://localhost:7283/api/boards)
      const response = await axiosInstance.post<BoardDto>("/boards", newBoard);
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Board Creation failed",
      );
    }
  },
);

/* Action to add a user to a project/board
 * Sends a POST request to link a user by email to a specific board with a role
 */
export const addUserToBoard = createAsyncThunk(
  "project/addUserToBoard",
  async (payload: AddUserToBoardDto, { rejectWithValue }) => {
    try {
      // Adjusted endpoint: /api/boards/{id}/members (check your backend route)
      const response = await axiosInstance.post(
        `/boards/${payload.boardId}/members`,
        {
          email: payload.email,
          role: payload.role,
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Failed to add user to project",
      );
    }
  },
);

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },

  // Handle all Thunk lifecycle states here
  extraReducers: (builder) => {
    builder
      /* --- Board Fetching --- */
      .addCase(fetchBoardsByUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchBoardsByUser.fulfilled,
        (state, action: PayloadAction<BoardDto[]>) => {
          state.loading = false;
          state.boards = action.payload;
        },
      )
      /* --- Board Creation --- */
      .addCase(createBoard.fulfilled, (state, action) => {
        // Add the new board returned by the server to the array
        state.boards.push(action.payload);
        state.loading = false;
      })
      /* --- Add User to Board --- */
      .addCase(addUserToBoard.fulfilled, (state) => {
        state.loading = false;
        // Logic: You can update the local state if your BoardDto
        // contains a list of members, otherwise just stop loading.
      })
      /* --- Universal Matchers for DRY Logic --- */
      // Handle all pending board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("project/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.error = null; // Clear error on every new attempt
          state.loading = true;
        },
      )
      // Handle all rejected board actions
      .addMatcher(
        (action) =>
          action.type.startsWith("project/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          // Set error message from payload or generic fallback
          state.error = action.payload || "Operation failed";
        },
      );
  },
});

export const { clearError } = projectSlice.actions;

export default projectSlice.reducer;
