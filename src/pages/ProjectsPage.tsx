import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { type RootState, type AppDispatch } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import { setAuthToken } from "../api/axiosInstance";
import {
  fetchBoardsByUser,
  createBoard,
  addUserToBoard,
  clearError,
  removeUserFromBoard,
  deleteBoard,
} from "../store/board/projectSlice";
import { logout } from "../store/auth/authSlice";

interface ProjectsPageProps {
  onSelectBoard: (id: number) => void;
}

const ProjectsPage = ({ onSelectBoard }: ProjectsPageProps) => {
  const { user, getAccessTokenSilently, logout: auth0Logout } = useAuth0();
  const dispatch = useDispatch<AppDispatch>();

  // Get data and global states from Redux
  const { boards, loading, error } = useSelector(
    (state: RootState) => state.project,
  );

  // Local state for Create Project Dialog
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Local state for "Add User" (Invite) Dialog
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "User">("User");

  // Local state for "Remove User from Project" Dialog
  const [removeUserOpen, setRemoveUserOpen] = useState(false);
  const [removeUserEmail, setRemoveUserEmail] = useState("");

  // effect for initial board data fetching
  useEffect(() => {
    let isMounted = true;

    const initBoard = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoardsByUser());
        }
      } catch (e) {
        if (isMounted) {
          console.error("Error getting token:", e);
        }
      }
    };
    initBoard();
    return () => {
      isMounted = false;
    };
  }, [dispatch, getAccessTokenSilently, user?.sub]);

  const handleCreateBoard = () => {
    dispatch(createBoard({ title, description }));
    setOpen(false);
    setTitle("");
    setDescription("");
  };

  // Handler to add a user to the project using Redux action
  const handleAddUserSubmit = () => {
    if (selectedBoardId && newUserEmail) {
      dispatch(
        addUserToBoard({
          boardId: selectedBoardId,
          email: newUserEmail,
          role: newUserRole, // Fixed role as per requirements
        }),
      )
        .unwrap() // Allows us to handle the result of the async thunk
        .then(() => {
          // to update the list of boards
          dispatch(fetchBoardsByUser());
          setAddUserOpen(false);
          setNewUserEmail("");
        })
        .catch(() => {
          // Error is already handled by Redux global state (error matcher)
        });
    }
  };

  // Handler to remove a user from the project using Redux action
  const handleRemoveUserSubmit = () => {
    if (selectedBoardId && removeUserEmail) {
      dispatch(
        removeUserFromBoard({
          boardId: selectedBoardId,
          email: removeUserEmail,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(fetchBoardsByUser());
          setRemoveUserOpen(false);
          setRemoveUserEmail("");
        });
    }
  };

  const handleDeleteClick = (boardId: number) => {
    if (window.confirm("Delete this board?")) {
      // Deleting via API
      dispatch(deleteBoard({ boardId: boardId }));
    }
  };

  // Close Snackbar and clear Redux error
  const handleCloseError = () => {
    dispatch(clearError());
  };

  const handleLogout = () => {
    // Logout logic (clear token, dispatch logout action, etc.)
    dispatch(logout());
    auth0Logout({
      logoutParams: { returnTo: window.location.origin },
    });
  };

  if (loading && boards.length === 0) {
    // Show the spinner only on first load when there are no columns yet
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Notifications for Errors */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">My Projects</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => handleLogout()}
            sx={{ mr: 2 }}
          >
            Logout
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Create Project
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {boards.map((board) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={board.id}>
            <Card variant="outlined">
              <CardActionArea onClick={() => onSelectBoard(board.id)}>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Typography variant="h6">{board.title}</Typography>
                    <Chip
                      label={board.role}
                      size="small"
                      color={board.role === "Admin" ? "primary" : "default"}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ mt: 1 }}
                  >
                    {board.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
              {/* INVITE ACTION: Only visible to Admins */}
              {board.role === "Admin" && (
                <Box
                  sx={{ p: 1, borderTop: "1px solid #eee", textAlign: "right" }}
                >
                  <Tooltip title="Add member by email">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigating to the board
                        setSelectedBoardId(board.id);
                        setAddUserOpen(true);
                      }}
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove member by email">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoardId(board.id);
                        setRemoveUserOpen(true);
                      }}
                    >
                      <PersonRemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove this board">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(board.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* --- Dialog: Create New Project --- */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => handleCreateBoard()}
            disabled={title.trim().length < 3 || description.trim().length < 10}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Dialog: Add User to Project --- */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Enter the email address and select the permission level for the new
            member.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="User Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            sx={{ mb: 3 }}
          />
          {/* Permission Level Selection */}
          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              sx={{ typography: "body2", fontWeight: "bold", mb: 1 }}
            >
              Permission Level
            </FormLabel>
            <RadioGroup
              row
              value={newUserRole}
              // Use type assertion if event value isn't strictly typed by the UI library
              onChange={(e) =>
                setNewUserRole(e.target.value as "Admin" | "User")
              }
            >
              <FormControlLabel
                value="User"
                control={<Radio size="small" />}
                label="User"
              />
              <FormControlLabel
                value="Admin"
                control={<Radio size="small" />}
                label="Admin"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddUserSubmit}
            disabled={loading || !newUserEmail.includes("@")}
          >
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Dialog: Remove User from Project --- */}
      <Dialog open={removeUserOpen} onClose={() => setRemoveUserOpen(false)}>
        <DialogTitle>Remove User from Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the email of the user you want to remove from this project.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="User Email"
            type="email"
            fullWidth
            variant="outlined"
            value={removeUserEmail}
            onChange={(e) => setRemoveUserEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveUserOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemoveUserSubmit}
            disabled={!removeUserEmail.includes("@")}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
