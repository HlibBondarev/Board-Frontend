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
  ToggleButton, // Use ToggleButton for better UX
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react"; // Assuming Auth0 is used based on AppSettings
import { type AppDispatch, type RootState } from "../../store/store";
import {
  createIssue,
  updateIssue,
  type IssueDto,
  type IssueCreateArgs,
  type IssueUpdateArgs,
} from "../../store/board/boardSlice";
import {
  PersonAddAlt as PersonIcon,
  PersonOff as PersonOffIcon,
} from "@mui/icons-material";

interface Props {
  open: boolean;
  handleClose: () => void;
  columnId: number;
  issue?: IssueDto;
}

const IssueModal = ({ open, handleClose, columnId, issue }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth0(); // Get current authenticated user

  // 1. User inputs: Title, Description, and optionally Due Date
  const [title, setTitle] = useState(issue?.title || "");
  const [description, setDescription] = useState(issue?.description || "");
  const [dueDate, setDueDate] = useState<Dayjs | null>(
    issue?.dueDate ? dayjs(issue.dueDate) : null,
  );
  // State for "Assign yourself" feature
  const [isSelfAssigned, setIsSelfAssigned] = useState(
    issue?.assigneeId === user?.sub ? true : false,
  );

  // 2. Calculated properties from existing state
  const columns = useSelector((state: RootState) => state.board.columns);
  const currentColumn = columns.find((c) => c.id === columnId);
  const nextPosition = currentColumn?.issues?.length || 0; // Position is 0-based index
  // Get userName from Redux
  const { userName } = useSelector((state: RootState) => state.project);

  const handleSave = async () => {
    if (issue) {
      // Use UpdateIssueDto (no creatorName)
      const updatePayload: IssueUpdateArgs = {
        issueId: Number(issue?.id),
        updatedIssue: {
          title,
          description,
          dueDate: dueDate ? dueDate.toISOString() : null,
          columnId: issue.columnId,
          assigneeId: isSelfAssigned ? user?.sub || null : null,
          assigneeName: isSelfAssigned ? userName || null : null,
        },
      };
      dispatch(updateIssue(updatePayload));
    } else {
      // Use CreateIssueDto
      const createPayload: IssueCreateArgs = {
        columnId: Number(columnId),
        newIssue: {
          tempId: `temp-${crypto.randomUUID()}`,
          title,
          description,
          dueDate: dueDate ? dueDate.toISOString() : null,
          positionInColumn: nextPosition,
          createdAt: new Date().toISOString(),
          creatorId: user?.sub || "guest",
          creatorName: user?.name || null,
          assigneeId: isSelfAssigned ? user?.sub || null : null,
          assigneeName: isSelfAssigned ? userName || null : null,
        },
      };
      dispatch(createIssue(createPayload));

      setTitle("");
      setDescription("");
      setDueDate(null);
      setIsSelfAssigned(false);
    }

    handleClose(); // Close modal immediately for "fast" feel
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disablePortal={false}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {issue ? "Update Issue" : "Add New Issue"}
      </DialogTitle>
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
          disabled={title.trim().length < 3 || description.trim().length < 10}
          disableElevation
        >
          {issue ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IssueModal;
