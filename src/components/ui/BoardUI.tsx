import React from "react";
import {
  Box,
  Typography,
  Chip,
  Fade,
  IconButton,
  Button,
  TextField,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type SensorDescriptor,
  type SensorOptions,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import GlobalErrorSnackbar from "../GlobalErrorSnackbar";
import { type IssueDto, type ColumnDto } from "../../store/board/boardSlice";

/**
 * Interface defining the expected props for the Board UI.
 */
interface BoardUIProps {
  columns: ColumnDto[];
  loading: boolean;
  activeIssue: IssueDto | null;
  sensors: SensorDescriptor<SensorOptions>[];
  collisionDetection?: CollisionDetection; // Crucial for catching empty columns
  filterAssigneeName: string | null;
  isAddingColumn: boolean;
  newColumnName: string;
  newColumnDescription: string;
  renderColumn: (column: ColumnDto) => React.ReactNode;
  renderIssueOverlay: (issue: IssueDto) => React.ReactNode;
  onBack: () => void;
  onClearFilter: () => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver: (event: DragOverEvent) => void; // Handles real-time column jumping
  onAddColumn: () => void;
  onCancelAddColumn: () => void;
  setIsAddingColumn: (val: boolean) => void;
  setNewColumnName: (val: string) => void;
  setNewColumnDescription: (val: string) => void;
  isDemo?: boolean;
  onMigrate?: () => void;
}

const BoardUI: React.FC<BoardUIProps> = (props) => {
  // Show full-screen loader if initial data is being fetched
  if (props.loading && props.columns.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndContext
      sensors={props.sensors}
      /**
       * Priority: rectIntersection (passed from BoardPage) for better empty column detection.
       * Fallback: closestCorners for standard sorting logic.
       */
      collisionDetection={props.collisionDetection || pointerWithin}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      onDragOver={props.onDragOver}
    >
      <Box
        sx={{
          backgroundColor: "#0079bf", // Original blue Trello-like design
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "auto",
          width: "100%",
          "&::-webkit-scrollbar": { height: 12 },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 2,
          },
        }}
      >
        {/* Top Header: Back Button, Title, and Migration Button */}
        <Box
          sx={{ p: 3, pl: 4, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={props.onBack} sx={{ color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="700" color="white">
              Dashboard
            </Typography>

            {props.isDemo && props.columns.length > 0 && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CloudUploadIcon />}
                onClick={props.onMigrate}
                sx={{
                  ml: 3,
                  backgroundColor: "#2e7d32",
                  fontWeight: "bold",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { backgroundColor: "#1b5e20" },
                }}
              >
                Save to Cloud
              </Button>
            )}
          </Box>

          {/* Active Filter Indicator */}
          <Fade in={Boolean(props.filterAssigneeName)}>
            <Chip
              icon={<FilterIcon />}
              label={`Filter by: ${props.filterAssigneeName}`}
              onDelete={props.onClearFilter}
              color="primary"
              variant="filled"
              sx={{ fontWeight: 600, width: "fit-content" }}
            />
          </Fade>
        </Box>

        <GlobalErrorSnackbar />

        {/* Main Board Area: Render columns horizontally */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            px: 4,
            pb: 4,
            gap: 2,
            minWidth: "100%",
            width: "max-content",
          }}
        >
          {/* Render existing columns via the provided render prop */}
          {props.columns.map((col) => props.renderColumn(col))}

          {/* Add Column Section */}
          <Box sx={{ width: 300, flexShrink: 0 }}>
            {!props.isAddingColumn ? (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => props.setIsAddingColumn(true)}
                sx={{
                  justifyContent: "flex-start",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Add another column
              </Button>
            ) : (
              <Paper
                sx={{ p: 1.5, backgroundColor: "#f1f2f4", borderRadius: 2 }}
              >
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  placeholder="Column name..."
                  value={props.newColumnName}
                  onChange={(e) => props.setNewColumnName(e.target.value)}
                  sx={{ backgroundColor: "white", mb: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Description..."
                  value={props.newColumnDescription}
                  onChange={(e) =>
                    props.setNewColumnDescription(e.target.value)
                  }
                  sx={{ backgroundColor: "white", mb: 1.5 }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={props.onAddColumn}
                    disabled={!props.newColumnName.trim()}
                  >
                    Add
                  </Button>
                  <IconButton size="small" onClick={props.onCancelAddColumn}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>

      {/* Ghost representation during drag */}
      <DragOverlay adjustScale>
        {props.activeIssue ? props.renderIssueOverlay(props.activeIssue) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardUI;
