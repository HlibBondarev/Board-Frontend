import { Paper, Typography, Box, IconButton, Button } from "@mui/material";
import { Add as AddIcon, MoreHoriz as MoreIcon } from "@mui/icons-material";
import IssueCard from "./IssueCard";
import { type Column as ColumnType } from "../features/board/boardSlice";

interface Props {
  column: ColumnType;
}

const Column = ({ column }: Props) => {
  return (
    <Paper
      sx={{
        width: 300,
        backgroundColor: "#f4f5f7", // Classic Kanban column grey
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
          overflowY: "auto", // Scroll if many cards
          minHeight: 100,
          mb: 2,
        }}
      >
        {column.issues?.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </Box>

      {/* Add Issue Button */}
      <Button
        fullWidth
        startIcon={<AddIcon />}
        sx={{
          justifyContent: "flex-start",
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.05)" },
        }}
      >
        Add a card
      </Button>
    </Paper>
  );
};

export default Column;
