import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* HashRouter: the desktop shell loads this build from disk over file://,
        where BrowserRouter would read the whole filesystem path as the route.
        The hash is ignored by the server, so the web deployment is unaffected. */}
    <HashRouter>
      <ThemeProvider defaultTheme="dark" storageKey="admin-theme">
        <App />
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
