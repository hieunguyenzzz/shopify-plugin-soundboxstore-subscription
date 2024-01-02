import React from "react";
import ReactDOM from "react-dom/client";
import "vite/modulepreload-polyfill";
import App from "../../src/App";
import "./theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App home={home} />
  </React.StrictMode>,
);
