// src/pages/Login.js
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        // backend should send {detail: "..."} or {error: "..."}
        setError(data.detail || data.error || "Invalid login credentials.");
        return;
      }

      // Save token + user name
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("fullName", data.fullName || email); 

      navigate("/predict"); 
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Log in to discuss your loan decision and next steps.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            sx={{
              background: "linear-gradient(90deg,#0f624d,#148f77)",
              "&:hover": { background: "linear-gradient(90deg,#0c4c3c,#10705e)" },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Log In"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </Typography>
      </Paper>
    </Container>
  );
}

export default Login;
