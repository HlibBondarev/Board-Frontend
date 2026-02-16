import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Auth0Provider } from "@auth0/auth0-react";
import CssBaseline from "@mui/material/CssBaseline";
import { store } from "./store/store";
// import "./index.css";
import App from "./App";
import { authSettings } from "./AppSettings";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={authSettings.domain}
      clientId={authSettings.clientId}
      authorizationParams={{
        redirect_uri: authSettings.authorizationParams.redirect_uri,
        scope: authSettings.authorizationParams.scope,
        audience: authSettings.authorizationParams.audience,
      }}
    >
      <Provider store={store}>
        <CssBaseline />
        <App />
      </Provider>
    </Auth0Provider>
  </StrictMode>,
);
