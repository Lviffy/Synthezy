import { Route, Routes, Navigate } from "react-router-dom";
import WorkSpace from "./views/WorkSpace";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import AuthForm from "./components/AuthForm";

// Protected route wrapper
// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <AuthForm />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <WorkSpace />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;