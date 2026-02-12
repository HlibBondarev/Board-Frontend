import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Fade,
} from "@mui/material";
import {
  Close as CloseIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
/* 1. Import DragDropContext and DropResult for DND functionality */
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
/* 2. Import moveIssue (thunk) and moveIssueOptimistic (reducer) from your slice */
import {
  fetchBoard,
  clearFilter,
  moveIssue,
  moveIssueOptimistic,
} from "../features/board/boardSlice";
import { type RootState, type AppDispatch } from "../app/store"; // path to store
import Column from "../components/Column";

const BoardPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Get columns, loading status, and errors from Redux
  const { columns, loading, error, filterAssigneeName } = useSelector(
    (state: RootState) => state.board,
  );

  useEffect(() => {
    // Call the API on the first render to load the board data
    dispatch(fetchBoard());
  }, [dispatch]);

  /* 3. Define the handler for when a drag operation ends */
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    /* If there is no destination (dropped outside) or it's dropped in the same place, do nothing */
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const payload = {
      issueId: Number(draggableId),
      sourceColumnId: Number(source.droppableId),
      destinationColumnId: Number(destination.droppableId),
      newPosition: destination.index,
    };

    /* 4. Implement Optimistic UI update (update Redux state immediately) */
    dispatch(moveIssueOptimistic(payload));

    /* 5. Trigger the API call to update the backend database */
    dispatch(moveIssue(payload));

    console.log("Moved Issue:", payload);
  };

  if (loading) {
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
    /* 6. Wrap the entire board content with DragDropContext */
    <DragDropContext onDragEnd={onDragEnd}>
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
          <Typography variant="h4" fontWeight="700" sx={{ mb: 4, px: 1 }}>
            Dashboard
          </Typography>

          {/* Active Filter Badge */}
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

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
    </DragDropContext>
  );
};

export default BoardPage;
