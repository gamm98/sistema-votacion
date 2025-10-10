import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import HomeIcon from "@mui/icons-material/Home";
import BarChartIcon from "@mui/icons-material/BarChart";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <AppBar position="static" sx={{ bgcolor: "#1E3A8A" }}>
      <Toolbar>
        <HowToVoteIcon sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Sistema de Votación
        </Typography>
        <Button color="inherit" component={Link} to="/">
          <HomeIcon sx={{ mr: 1 }} /> Inicio
        </Button>
        <Button color="inherit" component={Link} to="/voting">
          <HowToVoteIcon sx={{ mr: 1 }} /> Votar
        </Button>
        <Button color="inherit" component={Link} to="/results">
          <BarChartIcon sx={{ mr: 1 }} /> Resultados
        </Button>
      </Toolbar>
    </AppBar>
  );
}
