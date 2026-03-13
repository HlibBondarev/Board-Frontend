import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch } from "react-redux";
import {
  CircularProgress,
  Box,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import BoardPage from "./pages/BoardPage";
import DemoBoardPage from "./components/demo/DemoBoardPage";
import ProjectsPage from "./pages/ProjectsPage";
import { migrateBoard } from "./store/board/boardSlice";
import { type AppDispatch } from "./store/store";
import { setAuthToken } from "./api/axiosInstance";

function App() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    getAccessTokenSilently,
  } = useAuth0();
  const dispatch = useDispatch<AppDispatch>();

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<
    number | string | null
  >(null);

  /**
   * Initialize state synchronously by checking localStorage immediately.
   * This prevents 'ProjectsPage' from mounting and triggering 'GET /api/boards'
   * during the very first render cycle after authentication.
   */
  const [isMigrating, setIsMigrating] = useState(() => {
    const isPending = localStorage.getItem("pending_migration") === "true";
    const demoData = localStorage.getItem("kanban_demo_data_v1");
    return isPending && !!demoData;
  });

  /**
   * Main migration logic triggered after authentication.
   */
  useEffect(() => {
    const performMigration = async () => {
      // Exit if not authenticated or no migration flag is set
      if (!isAuthenticated || !isMigrating) return;

      const demoData = localStorage.getItem("kanban_demo_data_v1");
      if (!demoData) {
        setIsMigrating(false);
        return;
      }

      try {
        const columns = JSON.parse(demoData);
        const token = await getAccessTokenSilently();

        // Inject token into axios instance for the migration request
        setAuthToken(token);

        // Execute migration thunk and unwrap the result to catch potential errors
        const result = await dispatch(
          migrateBoard({
            title: "Board imported from Demo",
            description: "Automatically migrated from local storage",
            columns,
          }),
        ).unwrap();

        // On Success: Clear data and navigate to the new board
        localStorage.removeItem("pending_migration");
        localStorage.removeItem("kanban_demo_data_v1");
        setSelectedBoardId(result.boardId);
        alert("Success! Your demo board has been saved to your account.");
      } catch (error) {
        // On Failure (400, 500 or Network error): Clear flags to unblock the app
        console.error("Migration auto-sync failed:", error);
        localStorage.removeItem("pending_migration");
        //localStorage.removeItem("kanban_demo_data_v1");
        alert("Migration failed, but you can continue.");
      } finally {
        // Ensure the loading state is released to show the main UI
        setIsMigrating(false);
      }
    };

    if (!isLoading) {
      performMigration();
    }
  }, [
    isAuthenticated,
    isLoading,
    isMigrating,
    dispatch,
    getAccessTokenSilently,
  ]);

  /**
   * Direct check of localStorage for the render block to act as a fail-safe
   * against async state updates during the initial render.
   */
  const hasPendingMigration =
    localStorage.getItem("pending_migration") === "true";

  /**
   * 1. Loading & Migration Barrier:
   * Prevents UI flickers and parallel API calls.
   */
  if (isLoading || isMigrating || (isAuthenticated && hasPendingMigration)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress />
        {(isMigrating || hasPendingMigration) && (
          <Typography variant="body1" color="textSecondary">
            Checking demo data synchronization...
          </Typography>
        )}
      </Box>
    );
  }

  /**
   * 2. Demo Mode View
   */
  if (isDemoMode) {
    return <DemoBoardPage onBack={() => setIsDemoMode(false)} />;
  }

  /**
   * 3. Authenticated Main View
   */
  if (isAuthenticated) {
    // Show specific board if selected (either manually or after migration)
    if (selectedBoardId) {
      return (
        <BoardPage
          boardId={Number(selectedBoardId)}
          onBack={() => setSelectedBoardId(null)}
        />
      );
    }
    // Show project list (GET /api/boards is triggered inside this component)
    return <ProjectsPage onSelectBoard={setSelectedBoardId} />;
  }

  /**
   * 4. Landing Page for Guest Users
   */
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={3}
      sx={{
        textAlign: "center",
        p: 3,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Typography variant="h3" fontWeight="bold" color="primary.main">
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
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Login with Auth0
        </Button>

        <Button
          variant="outlined"
          size="large"
          color="secondary"
          onClick={() => setIsDemoMode(true)}
          sx={{ px: 4, fontWeight: "bold", borderWidth: 2 }}
        >
          Try Demo Version
        </Button>
      </Stack>

      <Typography
        variant="caption"
        sx={{ mt: 2, maxWidth: 350, color: "text.secondary" }}
      >
        * In Demo mode, data is saved locally. No account required.
      </Typography>
    </Box>
  );
}

export default App;
