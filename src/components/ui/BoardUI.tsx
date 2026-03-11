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
} from "@mui/icons-material";
/* Correct imports for dnd-kit */
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type SensorDescriptor,
  type SensorOptions,
  /* Add these types */
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import GlobalErrorSnackbar from "../GlobalErrorSnackbar"; // Adjust path if needed
import { type IssueDto, type ColumnDto } from "../../store/board/boardSlice"; // Import real types

interface BoardUIProps {
  columns: ColumnDto[]; // Replaced 'any' with ColumnDto
  loading: boolean;
  activeIssue: IssueDto | null;
  sensors: SensorDescriptor<SensorOptions>[]; // Corrected Sensors type
  filterAssigneeName: string | null;
  isAddingColumn: boolean;
  newColumnName: string;
  newColumnDescription: string;
  renderColumn: (column: ColumnDto) => React.ReactNode;
  renderIssueOverlay: (issue: IssueDto) => React.ReactNode;
  onBack: () => void;
  onClearFilter: () => void;
  onDragStart: (event: DragStartEvent) => void; // Fixed: DragStartEvent
  onDragEnd: (event: DragEndEvent) => void; // Fixed: DragEndEvent
  onDragOver: (event: DragOverEvent) => void; // Fixed: DragOverEvent
  onAddColumn: () => void;
  onCancelAddColumn: () => void;
  setIsAddingColumn: (val: boolean) => void;
  setNewColumnName: (val: string) => void;
  setNewColumnDescription: (val: string) => void;
}

const BoardUI = (props: BoardUIProps) => {
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
      collisionDetection={closestCorners}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      onDragOver={props.onDragOver}
    >
      <Box
        sx={{
          backgroundColor: "#0079bf",
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
          </Box>
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
          {props.columns.map((col) => props.renderColumn(col))}
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
      <DragOverlay adjustScale>
        {props.activeIssue ? props.renderIssueOverlay(props.activeIssue) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardUI;
