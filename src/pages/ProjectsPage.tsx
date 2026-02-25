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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { type RootState, type AppDispatch } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import { setAuthToken } from "../api/axiosInstance";
import { fetchBoardsByUser, createBoard } from "../store/board/projectSlice";

interface ProjectsPageProps {
  onSelectBoard: (id: number) => void;
}

const ProjectsPage = ({ onSelectBoard }: ProjectsPageProps) => {
  const { user, getAccessTokenSilently, logout } = useAuth0();
  // Get boards and loading status from Redux
  const { boards, loading } = useSelector((state: RootState) => state.project);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState(user?.sub || "");

  const dispatch = useDispatch<AppDispatch>();

  // effect for initial board data fetching
  useEffect(() => {
    let isMounted = true;

    const initBoard = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoardsByUser({ userId: user?.sub }));
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

  const handleCreateBoard = async () => {
    const createPayload = {
      title,
      description,
      userId,
    };
    dispatch(createBoard(createPayload));
    setOpen(false);
    setTitle("");
    setDescription("");
    setUserId("");
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4">My Projects</Typography>
        <Box>
          <Button variant="outlined" onClick={() => logout()} sx={{ mr: 2 }}>
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
            </Card>
          </Grid>
        ))}
      </Grid>

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
            disabled={title.length < 3}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
