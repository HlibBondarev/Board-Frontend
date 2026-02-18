import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Typography,
  Tooltip,
  // IconButton,
  ToggleButton, // Use ToggleButton for better UX
  // InputAdornment,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react"; // Assuming Auth0 is used based on AppSettings
import { type AppDispatch, type RootState } from "../../store/store";
import { createIssue, type CreateIssueDto } from "../../store/board/boardSlice";
import {
  PersonAddAlt1 as PersonIcon,
  PersonOff as PersonOffIcon,
} from "@mui/icons-material";

interface Props {
  open: boolean;
  handleClose: () => void;
  columnId: number;
}

const CreateIssueModal = ({ open, handleClose, columnId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth0(); // Get current authenticated user

  // 1. User inputs: Title, Description, and optionally Due Date
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);

  // State for "Assign yourself" feature
  const [isSelfAssigned, setIsSelfAssigned] = useState(false);

  // 2. Calculated properties from existing state
  const columns = useSelector((state: RootState) => state.board.columns);
  const currentColumn = columns.find((c) => c.id === columnId);
  const nextPosition = currentColumn?.issues?.length || 0; // Position is 0-based index

  const handleSave = async () => {
    // Constructing the payload based on requirements
    const payload: CreateIssueDto = {
      // Manual inputs
      tempId: `temp-${crypto.randomUUID()}`, // Generate unique temp ID
      title,
      description,
      dueDate: dueDate ? dueDate.toISOString() : null,

      // Auto-calculated system properties
      columnId,
      positionInColumn: nextPosition,
      createdAt: new Date().toISOString(),
      creatorId: user?.sub || "guest-user", // Use sub from Auth0 or fallback
      creatorName: user?.name || null,

      // 3. Assignee logic: set to current user ID if button was clicked
      assigneeId: isSelfAssigned ? user?.sub : undefined,
      assigneeName: isSelfAssigned ? user?.name || null : undefined,
    };

    handleClose(); // Close modal immediately for "fast" feel
    await dispatch(createIssue(payload));

    // Reset state and close modal
    setTitle("");
    setDescription("");
    setDueDate(null);
    setIsSelfAssigned(false);
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

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Deadline (Optional)"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                  },
                }}
              />
            </LocalizationProvider>

            {/* Improved Toggle Button Design */}
            <Tooltip
              title={isSelfAssigned ? "Unassign yourself" : "Assign to me"}
              arrow
            >
              <ToggleButton
                value="check"
                selected={isSelfAssigned}
                onChange={() => setIsSelfAssigned(!isSelfAssigned)}
                color="primary"
                sx={{
                  height: "56px", // Matches Material UI standard text field height
                  width: "56px", // Makes it square to save space
                  borderRadius: 1,
                  flexShrink: 0, // Prevents the button from shrinking
                  border: "1px solid rgba(0, 0, 0, 0.23)", // Matches TextField border
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  },
                }}
              >
                {isSelfAssigned ? <PersonIcon /> : <PersonOffIcon />}
              </ToggleButton>
            </Tooltip>
          </Box>

          {isSelfAssigned && (
            <Typography
              variant="caption"
              sx={{
                mt: -2,
                display: "flex",
                alignItems: "center",
                color: "primary.main",
                fontWeight: 500,
              }}
            >
              <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} /> Assigned to you
            </Typography>
          )}
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
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateIssueModal;
