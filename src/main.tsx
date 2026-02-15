import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { CssBaseline } from "@mui/material";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Provides the Redux store to the entire application */}
    <Provider store={store}>
      {/* Resets default browser CSS to MUI standards */}
      <CssBaseline />
      <App />
    </Provider>
  </StrictMode>,
);
