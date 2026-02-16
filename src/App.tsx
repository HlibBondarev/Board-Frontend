import { useAuth0 } from "@auth0/auth0-react";
import BoardPage from "./pages/BoardPage";
import { CircularProgress, Box, Button, Typography } from "@mui/material";

function App() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

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

  // If the user is authorized, we show the board
  if (isAuthenticated) {
    return <BoardPage />;
  }

  // If not, we show the "Welcome Screen" with your button
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={2}
    >
      <Typography variant="h4">Welcome to Task Board</Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => loginWithRedirect()}
      >
        Log In to Access Dashboard
      </Button>
    </Box>
  );
}

export default App;
