import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import BoardPage from "./pages/BoardPage";
import ProjectsPage from "./pages/ProjectsPage";
import {
  CircularProgress,
  Box,
  Button,
  Typography,
  Stack,
} from "@mui/material";

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<
    number | string | null
  >(null);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // 1. Demo Mode: Show Board using LocalStorage
  if (isDemoMode) {
    return <BoardPage isDemo={true} onBack={() => setIsDemoMode(false)} />;
  }

  // 2. Authenticated User Logic
  if (isAuthenticated) {
    if (selectedBoardId) {
      return (
        <BoardPage
          boardId={selectedBoardId}
          onBack={() => setSelectedBoardId(null)}
        />
      );
    }
    return <ProjectsPage onSelectBoard={setSelectedBoardId} />;
  }

  // 3. Welcome Screen
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={3}
      sx={{ textAlign: "center", p: 3 }}
    >
      <Typography variant="h3" fontWeight="bold">
        Task Board
      </Typography>
      <Typography variant="h6" color="textSecondary">
        Choose how you want to proceed:
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="contained"
          size="large"
          onClick={() => loginWithRedirect()}
          sx={{ px: 4 }}
        >
          Login with Auth0
        </Button>

        <Button
          variant="outlined"
          size="large"
          color="secondary"
          onClick={() => setIsDemoMode(true)}
          sx={{ px: 4 }}
        >
          Try Demo Version
        </Button>
      </Stack>

      <Typography variant="caption" sx={{ mt: 2, maxWidth: 350 }}>
        * In Demo mode, data is saved locally in your browser (LocalStorage).
      </Typography>
    </Box>
  );
}

export default App;
