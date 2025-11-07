import React from "react";
import { Container, Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("authToken");

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/predict");
    } else {
      navigate("/login");
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Box textAlign="center">
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Home Equity Loan Default Predictor
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Estimate your default risk, understand factors, and chat with an AI advisor.
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
          onClick={handleClick}
        >
          Try It Out
        </Button>
      </Box>
    </Container>
  );
}

export default LandingPage;
