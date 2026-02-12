import { useState } from "react";
import { Paper, Typography, Box, IconButton, Button } from "@mui/material";
import { Add as AddIcon, MoreHoriz as MoreIcon } from "@mui/icons-material";
import IssueCard from "./IssueCard";
import CreateIssueModal from "./modal/CreateIssueModal"; // Import your new modal
import { type Column as ColumnType } from "../features/board/boardSlice";

interface Props {
  column: ColumnType;
}

const Column = ({ column }: Props) => {
  // State to manage modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Functions to open and close the modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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

      {/* Issues List Container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          minHeight: 100,
          mb: 2,
        }}
      >
        {column.issues?.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </Box>

      {/* Add Issue Button - now with onClick handler */}
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
