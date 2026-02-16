import { Snackbar, Alert } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { type RootState, type AppDispatch } from "../store/store";
import { clearError } from "../store/board/boardSlice";

const GlobalErrorSnackbar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const error = useSelector((state: RootState) => state.board.error);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    dispatch(clearError());
  };

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        variant="filled"
        sx={{ width: "100%" }}
      >
        {error}
      </Alert>
    </Snackbar>
  );
};

export default GlobalErrorSnackbar;
