import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  CardMedia,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Voting() {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  // 🔹 Recuperar nombre del usuario autenticado
  useEffect(() => {
    const storedName = localStorage.getItem("nombre");
    if (storedName) {
      setNombre(storedName);
      console.log("Usuario autenticado:", storedName);
    } else {
      console.warn("⚠️ No se encontró el nombre en localStorage");
    }
  }, []);

  // 🧩 Lista de candidatos
  const candidatos = [
    {
      id: 1,
      nombre: "Martin Vizcarra Cornejo",
      partido: "Partido Perú Primero",
      imagen: process.env.PUBLIC_URL + "/images/vizcarra.jpg",
    },
    {
      id: 2,
      nombre: "Pedro Pablo Kuczynski",
      partido: "Partido Peruanos por el Kambio",
      imagen: process.env.PUBLIC_URL + "/images/ppk.jpg",
    },
    {
      id: 3,
      nombre: "Keiko Fujimori Higuchi",
      partido: "Partido Fuerza Popular",
      imagen: process.env.PUBLIC_URL + "/images/keiko.jpg",
    },
  ];

  // ⏰ Cronómetro
  useEffect(() => {
    if (expired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          localStorage.removeItem("token");
          localStorage.removeItem("nombre");
          setMessage("⚠️ Tiempo agotado. Tu voto se considera nulo.");
          setTimeout(() => navigate("/"), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expired, navigate]);

  // ⏳ Formato del tiempo
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 🗳️ Enviar voto
  const handleVote = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Debes iniciar sesión para votar.");
      return;
    }

    if (!selected) {
      setMessage("Selecciona un candidato antes de votar.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://127.0.0.1:5000/api/vote",
        { candidato: selected.nombre },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setMessage("✅ Voto registrado correctamente. ¡Gracias por participar!");
        localStorage.removeItem("token");
        localStorage.removeItem("nombre");
        setTimeout(() => navigate("/"), 3000);
      } else {
        setMessage("⚠️ " + response.data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al registrar el voto. Verifica tu conexión o token.");
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Cerrar sesión manual
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nombre");
    navigate("/");
  };

  return (
    <div
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + "/images/fondovotacion.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Card central */}
      <Card
        sx={{
          width: "100%",
          maxWidth: 950,
          background: "rgba(255, 255, 255, 0.93)",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.45)",
          textAlign: "center",
        }}
      >
        {/* 🔷 Título principal */}
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#0D47A1" }}
        >
          🗳️ Sistema de Votación Segura
        </Typography>

        {/* 👋 Bienvenida personalizada */}
        {nombre && (
          <Typography
            variant="h5"
            sx={{
              color: "#1565C0",
              fontWeight: "bold",
              marginBottom: 2,
              animation: "fadeIn 1.5s ease-in-out",
            }}
          >
            👋 ¡Bienvenido, {nombre}!
          </Typography>
        )}

        {/* Cronómetro */}
        <Typography
          variant="h6"
          sx={{
            marginBottom: 3,
            color: timeLeft < 60 ? "red" : "#1565C0",
            fontWeight: "bold",
          }}
        >
          Tiempo restante: {formatTime(timeLeft)}
        </Typography>

        {/* Lista de candidatos */}
        <Grid container spacing={3} justifyContent="center">
          {candidatos.map((candidato) => (
            <Grid item xs={12} sm={6} md={4} key={candidato.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  borderRadius: "15px",
                  boxShadow: selected?.id === candidato.id ? 8 : 2,
                  border:
                    selected?.id === candidato.id
                      ? "4px solid #1565C0"
                      : "2px solid transparent",
                  transition: "0.3s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
                onClick={() => setSelected(candidato)}
              >
                <CardMedia
                  component="img"
                  height="220"
                  image={candidato.imagen}
                  alt={candidato.nombre}
                />
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#0D47A1" }}
                  >
                    {candidato.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {candidato.partido}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Botones */}
        <div style={{ marginTop: "35px" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleVote}
            disabled={loading || expired}
            sx={{ padding: "12px 35px", fontSize: "16px", marginRight: "15px" }}
          >
            {loading ? "Enviando voto..." : "Confirmar voto"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            sx={{ padding: "12px 30px", fontSize: "16px" }}
          >
            Salir del sistema
          </Button>
        </div>

        {/* Mensaje centrado */}
        {message && (
          <Typography
            variant="h6"
            align="center"
            sx={{
              marginTop: "25px",
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: "12px",
              padding: "15px 20px",
              color: message.includes("✅") ? "green" : "red",
              fontWeight: "bold",
              display: "inline-block",
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {message}
          </Typography>
        )}
      </Card>
    </div>
  );
}
