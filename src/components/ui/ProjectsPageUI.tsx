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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { type BoardDto } from "../../store/board/projectSlice";

// Define the interface for the UI props
interface ProjectsPageUIProps {
  boards: BoardDto[];
  loading: boolean;
  error: string | null;
  onSelectBoard: (id: number) => void;
  onLogout: () => void;
  onCloseError: () => void;

  // Board management
  dialogOpen: boolean;
  editMode: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (e: React.MouseEvent, board: BoardDto) => void;
  onCloseDialog: () => void;
  onSaveBoard: () => void;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;

  // User management
  addUserOpen: boolean;
  setAddUserOpen: (open: boolean) => void;
  removeUserOpen: boolean;
  setRemoveUserOpen: (open: boolean) => void;
  setSelectedBoardId: (id: number | null) => void;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserRole: "Admin" | "User";
  setNewUserRole: (role: "Admin" | "User") => void;
  removeUserEmail: string;
  setRemoveUserEmail: (email: string) => void;
  onAddUserSubmit: () => void;
  onRemoveUserSubmit: () => void;
  onDeleteBoard: (e: React.MouseEvent, id: number) => void;
}

const ProjectsPageUI = ({
  boards,
  loading,
  error,
  onSelectBoard,
  onLogout,
  onCloseError,
  dialogOpen,
  editMode,
  onOpenCreate,
  onOpenEdit,
  onCloseDialog,
  onSaveBoard,
  title,
  setTitle,
  description,
  setDescription,
  addUserOpen,
  setAddUserOpen,
  removeUserOpen,
  setRemoveUserOpen,
  setSelectedBoardId,
  newUserEmail,
  setNewUserEmail,
  newUserRole,
  setNewUserRole,
  removeUserEmail,
  setRemoveUserEmail,
  onAddUserSubmit,
  onRemoveUserSubmit,
  onDeleteBoard,
}: ProjectsPageUIProps) => {
  // Loading state handling
  if (loading && boards.length === 0) {
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
      {/* Error notification */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={onCloseError}>
        <Alert onClose={onCloseError} severity="error" sx={{ width: "100%" }}>
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
          <Button variant="outlined" onClick={onLogout} sx={{ mr: 2 }}>
            Logout
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onOpenCreate}
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

              {board.role === "Admin" && (
                <Box
                  sx={{ p: 1, borderTop: "1px solid #eee", textAlign: "right" }}
                >
                  <Tooltip title="Add member">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoardId(board.id);
                        setAddUserOpen(true);
                      }}
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove member">
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
                  <Tooltip title="Edit board">
                    <IconButton
                      size="small"
                      onClick={(e) => onOpenEdit(e, board)}
                    >
                      <EditIcon fontSize="small" sx={{ color: "green" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete board">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => onDeleteBoard(e, board.id)}
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

      {/* --- Board Create/Edit Dialog --- */}
      <Dialog open={dialogOpen} onClose={onCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editMode ? "Edit Project" : "Create New Project"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialog}>Cancel</Button>
          <Button
            onClick={onSaveBoard}
            variant="contained"
            disabled={title.trim().length < 3 || description.trim().length < 10}
          >
            {editMode ? "Save Changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Add User Dialog --- */}
      <Dialog open={addUserOpen} onClose={() => setAddUserOpen(false)}>
        <DialogTitle>Add User to Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User Email"
            type="email"
            fullWidth
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Role</FormLabel>
            <RadioGroup
              row
              value={newUserRole}
              onChange={(e) =>
                setNewUserRole(e.target.value as "Admin" | "User")
              }
            >
              <FormControlLabel value="User" control={<Radio />} label="User" />
              <FormControlLabel
                value="Admin"
                control={<Radio />}
                label="Admin"
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserOpen(false)}>Cancel</Button>
          <Button onClick={onAddUserSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Remove User Dialog --- */}
      <Dialog open={removeUserOpen} onClose={() => setRemoveUserOpen(false)}>
        <DialogTitle>Remove User from Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="User Email"
            type="email"
            fullWidth
            value={removeUserEmail}
            onChange={(e) => setRemoveUserEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveUserOpen(false)}>Cancel</Button>
          <Button
            onClick={onRemoveUserSubmit}
            variant="contained"
            color="error"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPageUI;
