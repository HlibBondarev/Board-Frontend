import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  MoreHoriz as MoreIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
} from "@mui/icons-material";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { type ColumnDto, type IssueDto } from "../../store/board/boardSlice";

interface ColumnUIProps {
  column: ColumnDto; // Changed from any
  issueIds: (string | number)[]; // Changed from any[] (dnd-kit uses IDs)
  canDelete: boolean;
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMenuClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenModal: () => void;
  /* Explicitly define as a callback function to satisfy ESLint */
  setNodeRef: (element: HTMLDivElement | null) => void;
  renderIssue: (issue: IssueDto) => React.ReactNode;
}

const ColumnUI = (props: ColumnUIProps) => (
  <Paper
    sx={{
      width: 300,
      backgroundColor: "#f4f5f7",
      borderRadius: 2,
      display: "flex",
      flexDirection: "column",
      maxHeight: "80vh",
      p: 1.5,
    }}
    elevation={0}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Typography variant="subtitle1" fontWeight="700" sx={{ px: 1 }}>
        {props.column.name}
      </Typography>
      <IconButton size="small" onClick={props.onMenuOpen}>
        <MoreIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={props.anchorEl}
        open={Boolean(props.anchorEl)}
        onClose={props.onMenuClose}
      >
        <MenuItem onClick={props.onEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={props.onDelete}
          disabled={!props.canDelete}
          sx={{ color: props.canDelete ? "error.main" : "text.disabled" }}
        >
          <ListItemIcon>
            <DeleteIcon
              fontSize="small"
              color={props.canDelete ? "error" : "disabled"}
            />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
    <Box
      ref={(node: HTMLDivElement | null) => props.setNodeRef(node)}
      sx={{ flexGrow: 1, overflowY: "auto", minHeight: 100, mb: 2 }}
    >
      <SortableContext
        id={String(props.column.id)}
        items={props.issueIds}
        strategy={verticalListSortingStrategy}
      >
        {/* 2. Fix for "Unexpected any" in map */}
        {props.column.issues?.map((issue: IssueDto) =>
          props.renderIssue(issue),
        )}
      </SortableContext>
    </Box>
    <Button
      fullWidth
      startIcon={<AddIcon />}
      onClick={props.onOpenModal}
      sx={{
        justifyContent: "flex-start",
        color: "text.secondary",
        textTransform: "none",
      }}
    >
      Add an issue
    </Button>
  </Paper>
);
export default ColumnUI;
