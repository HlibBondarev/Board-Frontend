import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box, // Use ToggleButton for better UX
} from "@mui/material";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react"; // Assuming Auth0 is used based on AppSettings
import { type AppDispatch } from "../../store/store";
import {
  createBoard,
  type CreateBoardDto,
} from "../../store/board/projectSlice";

interface Props {
  open: boolean;
  handleClose: () => void;
  board?: CreateBoardDto;
}

const BoardModal = ({ open, handleClose, board }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth0(); // Get current authenticated user

  // 1. User inputs: Title, Description, and optionally Due Date
  const [title, setTitle] = useState(board?.title || "");
  const [description, setDescription] = useState(board?.description || "");
  const [role, setRole] = useState<"Admin" | "User" | undefined>("Admin");
  const [userId, setUserId] = useState(user?.sub || "");

  const handleSave = async () => {
    const createPayload = {
      title,
      description,
      role,
      userId,
    };
    dispatch(createBoard(createPayload));

    setTitle("");
    setDescription("");
    setRole(undefined);
    setUserId("");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disablePortal={false}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{"Add New Board"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!title.trim()}
          disableElevation
        >
          {"Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardModal;
