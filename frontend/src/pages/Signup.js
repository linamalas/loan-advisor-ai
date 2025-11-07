// src/pages/Signup.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link as MuiLink,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, PersonAddAlt1 as SignupIcon } from '@mui/icons-material';

function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMessage(data.detail || "Signup failed.");
        return;
      }

      // Save token + name
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("fullName", data.fullName);
      localStorage.setItem("authEmail", email);

      navigate("/predict");
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Join to chat about your loan application.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            startIcon={<SignupIcon />}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Create account"}
          </Button>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" underline="hover">
              Log in
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Signup;
