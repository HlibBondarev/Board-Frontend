import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Box,
  Tooltip,
  ToggleButton,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  PersonAddAlt as PersonIcon,
  PersonOff as PersonOffIcon,
} from "@mui/icons-material";
/* 1. Import your issue type */
import { type IssueDto } from "../../store/board/boardSlice";

/* 2. Define a strict interface for Props */
interface DemoIssueModalProps {
  open: boolean;
  handleClose: () => void;
  columnId: number;
  issue?: IssueDto | null; // Can be null if creating a new one
  onSubmit: (issue: IssueDto) => void;
}

const DemoIssueModal = ({
  open,
  handleClose,
  columnId,
  issue,
  onSubmit,
}: DemoIssueModalProps) => {
  const [title, setTitle] = useState(issue?.title || "");
  const [desc, setDesc] = useState(issue?.description || "");
  const [dueDate, setDueDate] = useState<Dayjs | null>(
    issue?.dueDate ? dayjs(issue.dueDate) : null,
  );
  const [isSelfAssigned, setIsSelfAssigned] = useState(
    Boolean(issue?.assigneeName),
  );

  const handleSave = () => {
    /* Ensure the object matches the full IssueDto interface */
    const newIssue: IssueDto = {
      /* If your ID in IssueDto is strictly number, use Number() */
      id: issue?.id ? Number(issue.id) : Date.now(),
      title,
      description: desc,
      /* Fix: Change null to undefined to match IssueDto type */
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      columnId: Number(columnId),
      createdAt: issue?.createdAt || new Date().toISOString(),
      positionInColumn: issue?.positionInColumn || 0,

      /* Mock values for Demo mode to satisfy TypeScript */
      creatorId: "demo-admin",
      creatorName: "Demo Admin",

      /* Assignee logic */
      assigneeName: isSelfAssigned ? "Demo User" : null,
      assigneeId: isSelfAssigned ? "demo-id-123" : null,
    };

    onSubmit(newIssue);

    if (!issue) {
      setTitle("");
      setDesc("");
      setDueDate(null);
      setIsSelfAssigned(false);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {issue ? "Update Demo Issue" : "New Demo Issue"}
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
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Deadline"
                value={dueDate}
                onChange={(v) => setDueDate(v)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <Tooltip title="Assign to me (Demo)" arrow>
              <ToggleButton
                value="check"
                selected={isSelfAssigned}
                onChange={() => setIsSelfAssigned(!isSelfAssigned)}
                color="primary"
                sx={{ height: 56, width: 56 }}
              >
                {isSelfAssigned ? <PersonIcon /> : <PersonOffIcon />}
              </ToggleButton>
            </Tooltip>
          </Box>
          {isSelfAssigned && (
            <Typography variant="caption" color="primary.main">
              Assigned to Demo User
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={title.length < 3}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DemoIssueModal;
