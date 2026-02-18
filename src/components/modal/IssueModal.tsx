import { useState /* , useEffect */ } from "react";
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
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { /* dayjs, */ Dayjs } from "dayjs";
import { useDispatch } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import { type AppDispatch } from "../../store/store";
import {
  createIssue,
  updateIssue,
  type IssueDto,
  type CreateIssueDto,
  type UpdateIssueDto,
} from "../../store/board/boardSlice";
import { PersonAddAlt1 as PersonIcon } from "@mui/icons-material";

interface Props {
  open: boolean;
  handleClose: () => void;
  columnId: number;
  issue?: IssueDto;
}

const IssueModal = ({ open, handleClose, columnId, issue }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth0();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [isSelfAssigned, setIsSelfAssigned] = useState(false);

  // useEffect(() => {
  //   if (open) {
  //     setTitle(issue?.title || "");
  //     setDescription(issue?.description || "");
  //     setDueDate(issue?.dueDate ? dayjs(issue.dueDate) : null);
  //     setIsSelfAssigned(issue?.assigneeId === user?.sub);
  //   }
  // }, [issue, open, user?.sub]);

  const handleSave = () => {
    if (issue) {
      // Use UpdateIssueDto (no creatorName)
      const updatePayload: UpdateIssueDto = {
        id: issue.id,
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null,
        columnId: issue.columnId,
        //positionInColumn: issue.positionInColumn,
        //assigneeId: isSelfAssigned ? user?.sub : undefined,
        //assigneeName: isSelfAssigned ? user?.name : null,
      };
      dispatch(updateIssue(updatePayload));
    } else {
      // Use CreateIssueDto
      const createPayload: CreateIssueDto = {
        tempId: `temp-${crypto.randomUUID()}`,
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : null,
        columnId,
        positionInColumn: 0,
        createdAt: new Date().toISOString(),
        creatorId: user?.sub || "guest",
        creatorName: user?.name || null,
        assigneeId: isSelfAssigned ? user?.sub : undefined,
        assigneeName: isSelfAssigned ? user?.name || null : undefined,
      };
      dispatch(createIssue(createPayload));
    }
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {issue ? "Update Task" : "Add New Task"}
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
          <Box sx={{ display: "flex", gap: 1 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Deadline"
                value={dueDate}
                onChange={(v) => setDueDate(v)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
            <Tooltip title="Assign to me">
              <ToggleButton
                value="check"
                selected={isSelfAssigned}
                onChange={() => setIsSelfAssigned(!isSelfAssigned)}
                sx={{ width: 56, height: 56 }}
              >
                <PersonIcon color={isSelfAssigned ? "primary" : "inherit"} />
              </ToggleButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!title.trim()}
        >
          {issue ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IssueModal;
