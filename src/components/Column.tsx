import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { Paper, Typography, Box, IconButton, Button } from "@mui/material";
import { Add as AddIcon, MoreHoriz as MoreIcon } from "@mui/icons-material";
import IssueCard from "./IssueCard";
import CreateIssueModal from "./modal/CreateIssueModal";
import { type Column as ColumnType } from "../store/board/boardSlice";
import { type RootState } from "../store/store";
/* 1. Import @dnd-kit core and sortable tools */
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Props {
  column: ColumnType;
}

const Column = ({ column }: Props) => {
  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Functions to open and close the modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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
        maxHeight: "100%",
        p: 1.5,
        m: 1,
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
        <IconButton size="small">
          <MoreIcon fontSize="small" />
        </IconButton>
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
        Add a card
      </Button>

      {/* Render the modal and pass necessary props */}
      <CreateIssueModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        columnId={column.id}
      />
    </Paper>
  );
};

export default Column;
