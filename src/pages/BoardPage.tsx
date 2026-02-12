import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { fetchBoard } from "../features/board/boardSlice";
import { type RootState, type AppDispatch } from "../app/store"; // path to store
import Column from "../components/Column";

const BoardPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Get columns, loading status, and errors from Redux
  const { columns, loading, error } = useSelector(
    (state: RootState) => state.board,
  );

  useEffect(() => {
    // Call the API on the first render to load the board data
    dispatch(fetchBoard());
  }, [dispatch]);

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
          Product Roadmap
        </Typography>

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
  );
};

export default BoardPage;
