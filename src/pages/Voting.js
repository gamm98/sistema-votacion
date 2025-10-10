import React, { useState } from "react";
import {
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  Avatar,
  Container,
  Paper,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HowToVoteIcon from "@mui/icons-material/HowToVote";

const candidates = [
  { id: 1, name: "Candidato A", img: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" },
  { id: 2, name: "Candidato B", img: "https://cdn-icons-png.flaticon.com/512/3135/3135823.png" },
  { id: 3, name: "Candidato C", img: "https://cdn-icons-png.flaticon.com/512/3135/3135815.png" },
];

export default function Voting() {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleConfirm = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No hay sesión válida.");
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/vote", {
        token,
        candidato: selected.name,
      });
      if (response.data.success) {
        setMessage("Voto registrado correctamente");
        setTimeout(() => navigate("/results"), 1500);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al votar");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          boxShadow: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.95)",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="#1E3A8A" gutterBottom>
          Selecciona tu candidato
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {candidates.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card
                onClick={() => setSelected(c)}
                sx={{
                  cursor: "pointer",
                  p: 2,
                  borderRadius: 3,
                  textAlign: "center",
                  boxShadow: selected?.id === c.id ? 6 : 2,
                  border:
                    selected?.id === c.id
                      ? "3px solid #1E3A8A"
                      : "1px solid #ccc",
                  "&:hover": { boxShadow: 5 },
                }}
              >
                <Avatar
                  src={c.img}
                  sx={{ width: 80, height: 80, mx: "auto", mb: 2 }}
                />
                <CardContent>
                  <Typography variant="h6">{c.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          sx={{
            mt: 3,
            bgcolor: "#1E3A8A",
            "&:hover": { bgcolor: "#172554" },
          }}
          disabled={!selected}
          onClick={handleConfirm}
          startIcon={<HowToVoteIcon />}
        >
          Confirmar Voto
        </Button>

        <Typography color="success.main" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Paper>
    </Container>
  );
}
