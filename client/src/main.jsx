import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";
import { AppContextProvider } from "./provider/AppStates.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </AuthProvider>
  </BrowserRouter>
);
