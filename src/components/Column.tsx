import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
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
import IssueCard from "./IssueCard";
import IssueModal from "./modal/IssueModal";
import {
  type ColumnDto as ColumnType,
  type ColumnCreateUpdateDto,
} from "../store/board/boardSlice";
import { type RootState } from "../store/store";
/* 1. Import @dnd-kit core and sortable tools */
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Props {
  column: ColumnType;
  onUpdateColumn?: (
    id: number | string,
    updateColumn: ColumnCreateUpdateDto,
  ) => void;
  onDeleteColumn?: (id: number | string) => void;
}

const Column = ({ column, onUpdateColumn, onDeleteColumn }: Props) => {
  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for controlling the dropdown menu "..."
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  // Functions to open and close the modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // Requirement: Only Admin can delete, and only if column is empty
  const userRole = useSelector((state: RootState) => state.board.userRole);
  const canDelete =
    userRole === "Admin" && (!column.issues || column.issues.length === 0);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);
  const handleEditClick = () => {
    handleMenuClose();
    // Prompting for both Name and Description
    const newName = prompt("Enter new column name:", column.name);
    const newDesc = prompt("Enter new column description:", column.description);

    if (newName && newDesc) {
      onUpdateColumn?.(column.id, { name: newName, description: newDesc });
    }
  };
  const handleDeleteClick = () => {
    handleMenuClose();

    if (!canDelete) {
      alert("Only Admins can delete columns, and the column must be empty.");
      return;
    }

    if (window.confirm(`Delete column "${column.name}"?`)) {
      onDeleteColumn?.(column.id);
    }
  };

  const filterAssigneeId = useSelector(
    (state: RootState) => state.board.filterAssigneeId,
  );

  /* 2. IMPORTANT: DND works best with the full list. 
     If filter is active, we disable DND logic or show filtered items as non-draggable. */
  /* Filter issues if a specific assignee filter is active */
  const visibleIssues = useMemo(() => {
    return filterAssigneeId
      ? column.issues?.filter((issue) => issue.assigneeId === filterAssigneeId)
      : column.issues;
  }, [column.issues, filterAssigneeId]);

  /* 3. Setup the column as a Droppable zone */
  const { setNodeRef } = useDroppable({
    id: String(column.id),
    data: {
      columnId: column.id, // Pass columnId to handleDragEnd in BoardPage
    },
  });

  /* 4. Create an array of IDs for SortableContext (required by @dnd-kit) */
  const issueIds = useMemo(
    () => visibleIssues?.map((issue) => issue.id) || [],
    [visibleIssues],
  );

  return (
    <Paper
      sx={{
        width: 300,
        backgroundColor: "#f4f5f7",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: "fit-content",
        maxHeight: "80vh",
        p: 1.5,
      }}
      elevation={0}
    >
      {/* Column Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="700" sx={{ px: 1 }}>
          {column.name}
        </Typography>

        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreIcon fontSize="small" />
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleDeleteClick}
            disabled={!canDelete} // Visual feedback
            sx={{ color: canDelete ? "error.main" : "text.disabled" }}
          >
            <ListItemIcon>
              <DeleteIcon
                fontSize="small"
                color={canDelete ? "error" : "disabled"}
              />
            </ListItemIcon>
            <ListItemText>Delete Column</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* 5. Issues List Container */}
      <Box
        ref={setNodeRef} // Set the droppable ref to this container
        sx={{ flexGrow: 1, overflowY: "auto", minHeight: 100, mb: 2 }}
      >
        <SortableContext
          id={String(column.id)} // ADD THIS LINE
          items={issueIds}
          strategy={verticalListSortingStrategy}
        >
          {visibleIssues?.map((issue) => (
            /* Index is no longer required for @dnd-kit Sortable */
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
      </Box>

      {/* 6. Add Issue Button - now with onClick handler */}
      <Button
        fullWidth
        startIcon={<AddIcon />}
        onClick={handleOpenModal} // Trigger modal open
        sx={{
          justifyContent: "flex-start",
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.05)" },
        }}
      >
        Add an issue
      </Button>

      {/* Render the modal and pass necessary props */}
      <IssueModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        columnId={column.id}
      />
    </Paper>
  );
};

export default Column;
