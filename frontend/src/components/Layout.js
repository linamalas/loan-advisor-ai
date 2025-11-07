// src/components/Layout.js
import React from "react";
import { AppBar, Toolbar, Typography, Box, Button, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import robotLogo from "../assets/robot.png";

function Layout({ children }) {
  const navigate = useNavigate();
  const authToken = localStorage.getItem("authToken");
  const fullName = localStorage.getItem("fullName");
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("fullName");
    navigate("/login");
  };

  return (
    <Box>
      <AppBar
        position="sticky"
        sx={{
          background: "linear-gradient(90deg,#0f624d,#148f77)",
          height: 70,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Left: Logo */}
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <img
              src={robotLogo}
              alt="logo"
              style={{
                width: 36,
                height: 36,
                marginRight: 8,
                background: "#fff",
                borderRadius: "50%",
                padding: 4,
              }}
            />
            <Typography variant="h6" fontWeight={700}>
              LoanAdvisor AI
            </Typography>
          </Box>

          {/* Right: Auth Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {authToken ? (
              <>
                <Avatar sx={{ bgcolor: "#fff", color: "#0f624d", fontWeight: "bold" }}>
                  {initial}
                </Avatar>
                <Button
                  sx={{
                    color: "#fff",
                    fontWeight: "bold",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" },
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate("/signup")}>
                  Sign Up
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}

export default Layout;
