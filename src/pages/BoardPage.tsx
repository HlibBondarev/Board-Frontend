import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Fade,
  IconButton,
  Button,
  TextField,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
/* Import @dnd-kit for DND functionality */
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
/* Import thunks and reucers from the boardSlice */
import {
  fetchBoard,
  clearFilter,
  moveIssue,
  moveIssueOptimistic,
  resetBoard,
  addColumn,
  updateColumn,
  deleteColumn,
  type IssueDto,
} from "../store/board/boardSlice";
import { setAuthToken } from "../api/axiosInstance";
import { type RootState, type AppDispatch } from "../store/store";
import Column from "../components/Column";
import IssueCard from "../components/IssueCard";
import GlobalErrorSnackbar from "../components/GlobalErrorSnackbar";

interface BoardPageProps {
  isDemo?: boolean;
  boardId: number;
  onBack: () => void;
}

const BoardPage = ({ boardId, onBack }: BoardPageProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { getAccessTokenSilently } = useAuth0();

  /* Local state for adding a new column */
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnDescription, setNewColumnDescription] = useState("");

  /* State to keep track of the currently dragged issue */
  const [activeIssue, setActiveIssue] = useState<IssueDto | null>(null);

  // Get columns, loading status, errors filterAssigneeName and filterAssigneeId from Redux
  const { columns, loading, error, filterAssigneeName, filterAssigneeId } =
    useSelector((state: RootState) => state.board);

  /* Configure sensors with activation constraints */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Drag starts only after 5px movement to allow clicks on buttons/chips
      },
    }),
  );

  const handleUpdateColumn = (
    columnId: number,
    name: string,
    description: string,
  ) => {
    // Dispatching thunk with updated data (Name + Description)
    dispatch(
      updateColumn({
        columnId: columnId,
        updateColumn: { name, description },
      }),
    );
  };

  const handleDeleteColumn = (columnId: number) => {
    // Deleting via API
    dispatch(deleteColumn({ columnId: columnId }));
  };

  // effect for initial board data fetching
  useEffect(() => {
    let isMounted = true;

    const initBoard = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoard({ boardId: boardId }));
        }
      } catch (e) {
        if (isMounted) {
          console.error("Error getting token:", e);
        }
      }
    };
    initBoard();

    return () => {
      isMounted = false;
      dispatch(resetBoard());
    };
  }, [dispatch, getAccessTokenSilently, boardId]);

  // This effect handles the state rollback specifically when an error occurs
  useEffect(() => {}, [error]);

  const isFilterActive = Boolean(filterAssigneeId);

  const handleCancel = () => {
    setIsAddingColumn(false);
    setNewColumnName("");
    setNewColumnDescription("");
  };

  const handleAddColumn = () => {
    if (newColumnName.trim() && boardId) {
      dispatch(
        addColumn({
          boardId: Number(boardId),
          tempColumnId: `temp-${crypto.randomUUID()}`,
          newColumn: {
            name: newColumnName.trim(),
            description: newColumnDescription.trim(),
          },
        }),
      );
      handleCancel(); // Виглядає чисто і зрозуміло
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isFilterActive) return; // Block dragging when filter is active to prevent index mismatch

    /* Find the full issue object in your existing columns state */
    const issue = columns
      .flatMap((col) => col.issues)
      .find((i) => i.id === Number(event.active.id));

    if (issue) setActiveIssue(issue);
  };

  /* Logic to handle the end of a drag operation */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);
    if (isFilterActive || !over) return;

    const activeId = Number(active.id);
    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    // Final optimistic update to fix positions
    dispatch(
      moveIssueOptimistic({
        issueId: activeId,
        sourceColumnId: Number(activeContainer),
        destinationColumnId: Number(overContainer),
        overId: over.id,
      }),
    );

    // Sync with Server
    // We don't calculate 'finalIndex' here.
    // The thunk will use getState() to find the new position from Redux store.
    dispatch(
      moveIssue({
        issueId: activeId,
        columnId: Number(overContainer),
      }),
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (isFilterActive) return;
    const { active, over } = event;
    if (!over) return;

    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    // Handle cross-column movement during hover
    if (activeContainer && overContainer && activeContainer !== overContainer) {
      dispatch(
        moveIssueOptimistic({
          issueId: Number(active.id),
          sourceColumnId: Number(activeContainer),
          destinationColumnId: Number(overContainer),
          overId: over.id,
        }),
      );
    }
  };

  if (loading && columns.length === 0) {
    // Show the spinner only on first load when there are no columns yet
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
    /* Use DndContext */
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <Box
        sx={{
          backgroundColor: "#0079bf",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          /* Main scroll container: only this level handles overflow */
          overflowX: "auto",
          width: "100%",
          /* Custom scrollbar for better visibility on blue */
          "&::-webkit-scrollbar": { height: 12 },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            "&:hover": { backgroundColor: "rgba(255,255,255,0.4)" },
          },
        }}
      >
        {/* Header and Filters Section */}
        <Box
          sx={{ p: 3, pl: 4, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={onBack}
              sx={{ color: "white" }}
              aria-label="back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" fontWeight="700" color="white">
              Dashboard
            </Typography>
          </Box>

          <Fade in={Boolean(filterAssigneeName)}>
            <Chip
              icon={<FilterIcon />}
              label={`Filter by: ${filterAssigneeName}`}
              onDelete={() => dispatch(clearFilter())}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="filled"
              sx={{ fontWeight: 600, width: "fit-content" }}
            />
          </Fade>
        </Box>

        <GlobalErrorSnackbar />

        {/* Horizontal Columns Container */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            px: 4,
            pb: 4,
            gap: 2,
            /* minWidth ensures columns don't shrink and push the parent to scroll */
            minWidth: "100%",
            width: "max-content",
          }}
        >
          {/* Mapped Columns */}
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onUpdateColumn={(id, { name, description }) =>
                handleUpdateColumn(id as number, name, description)
              }
              onDeleteColumn={(id) => handleDeleteColumn(id as number)}
            />
          ))}

          {/* Add Column Section */}
          <Box sx={{ width: 300, flexShrink: 0 }}>
            {!isAddingColumn ? (
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddingColumn(true)}
                sx={{
                  justifyContent: "flex-start",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1.5,
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Add another column
              </Button>
            ) : (
              <Paper
                sx={{
                  p: 1.5,
                  backgroundColor: "#f1f2f4",
                  borderRadius: 2,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                }}
              >
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  placeholder="Enter column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 1,
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Enter description (optional)..."
                  value={newColumnDescription}
                  onChange={(e) => setNewColumnDescription(e.target.value)}
                  sx={{
                    backgroundColor: "white",
                    borderRadius: 1,
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": { fontSize: "0.85rem" },
                  }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleAddColumn}
                  >
                    Add column
                  </Button>
                  <IconButton size="small" onClick={handleCancel}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>

      <DragOverlay adjustScale={true}>
        {activeIssue ? <IssueCard issue={activeIssue} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardPage;
