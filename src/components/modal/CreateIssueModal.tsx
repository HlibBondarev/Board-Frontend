import { /* React, */ useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { /* dayjs, */ Dayjs } from "dayjs"; // Now used in state type and handleSave
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type RootState } from "../../store/store";
import { createIssue, type CreateIssueDto } from "../../store/board/boardSlice";

interface Props {
  open: boolean;
  handleClose: () => void;
  columnId: number;
}

const CreateIssueModal = ({ open, handleClose, columnId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // Local state for form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null); // Dayjs is used here

  const columns = useSelector((state: RootState) => state.board.columns);
  const currentColumn = columns.find((c) => c.id === columnId);
  const nextPosition = (currentColumn?.issues?.length || 0) + 1;

  const handleSave = async () => {
    const payload: CreateIssueDto = {
      title,
      description,
      columnId,
      dueDate: dueDate ? dueDate.toISOString() : null, // dayjs object converted to string
      positionInColumn: nextPosition,
      createdAt: new Date().toISOString(),
      creatorId: "temp-user-id",
    };

    await dispatch(createIssue(payload));

    // Reset and close
    setTitle("");
    setDescription("");
    setDueDate(null);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Add New Task</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label="Task Title"
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Deadline (Optional)"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disableElevation>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateIssueModal;
