import React from 'react';
import { AppBar, Toolbar, Typography, Button, Stack, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const fullName = localStorage.getItem('fullName') || localStorage.getItem('authEmail') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authEmail');
    navigate('/login');
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography component={Link} to="/" variant="h6" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
          Home Equity Insights
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} to="/chat" color="primary">Advisor Chat</Button>
          {!token ? (
            <>
              <Button component={Link} to="/login" variant="outlined">Log in</Button>
              <Button component={Link} to="/signup" variant="contained">Sign up</Button>
            </>
          ) : (
            <>
              <Avatar sx={{ width: 28, height: 28 }}>{fullName?.[0]?.toUpperCase?.() || 'U'}</Avatar>
              <Button onClick={handleLogout} color="inherit">Logout</Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;


