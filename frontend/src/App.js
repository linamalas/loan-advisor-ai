import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";   // new
import Login from "./pages/Login";
import Signup from "./pages/Signup";            // your loan form
import Results from "./pages/Results";           // new page
import Chatbot from "./pages/Chatbot";           // already exists
import Predict from "./pages/Predict"; // instead of Home
import Layout from "./components/Layout";
function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem("authToken"));

  React.useEffect(() => {
    const handleStorage = () => setIsAuthenticated(!!localStorage.getItem("authToken"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><LandingPage /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route
          path="/predict"
          element={isAuthenticated ? <Layout><Predict /> </Layout>: <Navigate to="/login" />}
        />
        <Route
          path="/results"
          element={isAuthenticated ? <Layout><Results /> </Layout>: <Navigate to="/login" />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <Layout><Chatbot /> </Layout>: <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
