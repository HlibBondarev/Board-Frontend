import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Chip,
  Fade,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
} from "../store/board/boardSlice";
import { setAuthToken } from "../api/axiosInstance";
import { type RootState, type AppDispatch } from "../store/store";
import Column from "../components/Column";
import { type IssueDto } from "../store/board/boardSlice";
import IssueCard from "../components/IssueCard";
import GlobalErrorSnackbar from "../components/GlobalErrorSnackbar";

interface BoardPageProps {
  isDemo?: boolean;
  boardId?: number | string | null;
  onBack: () => void;
}

const BoardPage = ({ boardId, onBack }: BoardPageProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { getAccessTokenSilently } = useAuth0();

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

  // effect for initial board data fetching
  useEffect(() => {
    let isMounted = true;

    const initBoard = async () => {
      try {
        const token = await getAccessTokenSilently();
        if (isMounted) {
          setAuthToken(token);
          dispatch(fetchBoard({ Id: Number(boardId) }));
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
          backgroundColor: "#ebedef",
          minHeight: "100vh",
          pt: 4,
          pb: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Container maxWidth={false}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4, mt: 1 }}
          >
            <IconButton
              onClick={onBack}
              sx={{ color: "text.primary" }}
              aria-label="back to projects"
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h4" fontWeight="700" sx={{ px: 1 }}>
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
              sx={{ fontWeight: 600 }}
            />
          </Fade>
          <GlobalErrorSnackbar /> {/* Listens for errors globally */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              overflowX: "auto",
              pb: 2,
              gap: 2,
            }}
          >
            {columns.map((col) => (
              <Column key={col.id} column={col} />
            ))}
          </Box>
        </Container>
      </Box>
      <DragOverlay adjustScale={true}>
        {activeIssue ? (
          /* Render the exact same component but as a static preview */
          <IssueCard issue={activeIssue} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardPage;
