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

interface UserBoards {
  userName: string;
  boards: BoardDto[];
}

export interface CreateBoardDto {
  title: string;
  description: string;
}

export interface UpdateBoardDto {
  boardId: number;
  title: string;
  description: string;
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
  userName: string;
}

const initialState: ProjectsState = {
  boards: [],
  loading: false,
  error: null,
  userName: "",
};

// Thunk to to get boards for a specific user
export const fetchBoardsByUser = createAsyncThunk(
  "project/fetchBoardsByUser",
  async (_, { rejectWithValue }) => {
    try {
      // GET request to .NET API (https://localhost:7283/api/boards)
      const response = await axiosInstance.get<UserBoards>(`/boards`);
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

// Thunk to create a board
export const createBoard = createAsyncThunk(
  "project/createBoard",
  async (newBoard: CreateBoardDto, { rejectWithValue }) => {
    try {
      // POST request to .NET API (https://localhost:7283/api/boards)
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

// Thunk to update the specific board
export const updateBoard = createAsyncThunk(
  "project/updateBoard",
  async (payload: UpdateBoardDto, { rejectWithValue }) => {
    try {
      // PUT request to .NET API (e.g., /api/boards/{boardId})
      const response = await axiosInstance.put<BoardDto>(
        `/boards/${payload.boardId}`,
        {
          title: payload.title,
          description: payload.description,
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail || "Error: Failed to update board",
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
      // Adjusted endpoint: https://localhost:7283/api/boards/{id}/members
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
        err.response?.data?.detail || "Error: Failed to add User to project",
      );
    }
  },
);

/* Action to remove a user from a project/board
 * Sends a DELETE request to removed a user by email from a specific board
 */
export const removeUserFromBoard = createAsyncThunk(
  "project/removeUserFromBoard",
  async (
    { boardId, email }: { boardId: number; email: string },
    { rejectWithValue },
  ) => {
    try {
      // Adjusted endpoint: /api/boards/{id}/members
      const response = await axiosInstance.delete<string>(
        `/boards/${boardId}/members`,
        {
          data: { email },
        },
      );
      return response.data;
    } catch (error) {
      const err = error as AxiosError<{ detail?: string }>;
      return rejectWithValue(
        err.response?.data?.detail ||
          "Error: Failed to remove User from project",
      );
    }
  },
);

// Thunk to delete a board
export const deleteBoard = createAsyncThunk(
  "project/deleteBoard",
  async (payload: { boardId: number }, { rejectWithValue }) => {
    try {
      // DELETE request to .NET API (e.g., /boards/{id})
      const response = await axiosInstance.delete<string>(
        `/boards/${payload.boardId}`,
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
      .addCase(
        fetchBoardsByUser.fulfilled,
        (state, action: PayloadAction<UserBoards>) => {
          state.loading = false;
          state.boards = action.payload.boards;
          state.userName = action.payload.userName;
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
        // Logic: for updating the local state if BoardDto
        // contains a list of members, otherwise just stop loading.
        // Now BoardDto doesn't contain a list of members!
      })
      /* --- Remove User from Board --- */
      .addCase(removeUserFromBoard.fulfilled, (state) => {
        state.loading = false;
        // Logic: for updating the local state if BoardDto
        // contains a list of members, otherwise just stop loading.
        // Now BoardDto doesn't contain a list of members!
      })
      /* --- Board Deleting --- */
      .addCase(deleteBoard.fulfilled, (state, action) => {
        // Add the new board returned by the server to the array
        const boardId = action.meta.arg.boardId;
        const board = state.boards.find((c) => c.id === boardId);
        if (board) {
          state.boards = state.boards.filter((i) => i.id !== boardId);
        }
        state.loading = false;
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
