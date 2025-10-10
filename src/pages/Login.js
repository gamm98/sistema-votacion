import React, { useState, useRef } from "react";
import {
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Box,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [dni, setDni] = useState("");
  const [message, setMessage] = useState("");
  const [camaraActiva, setCamaraActiva] = useState(false);
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const captureAndSend = async () => {
    if (!dni) {
      setMessage("Debe ingresar su DNI antes de validar.");
      return;
    }

    // Capturar imagen de la cámara como base64
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      setMessage("No se pudo capturar la imagen. Verifique la cámara.");
      return;
    }

    // Convertir base64 a archivo blob
    const blob = await fetch(screenshot).then((res) => res.blob());
    const file = new File([blob], "captura.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("dni", dni);
    formData.append("imagen", file);

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        setMessage("Validación facial correcta. Redirigiendo...");
        setTimeout(() => navigate("/voting"), 1500);
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error de conexión con el servidor.");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/fondovotacion.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          width: { xs: "90%", sm: 450 },
          textAlign: "center",
          borderRadius: 3,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxShadow: 6,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#1E3A8A",
            mx: "auto",
            mb: 2,
            width: 64,
            height: 64,
          }}
        >
          <AccountCircleIcon fontSize="large" />
        </Avatar>

        <Typography variant="h5" fontWeight="bold" color="#1E3A8A" gutterBottom>
          Validación Facial del Votante
        </Typography>

        <TextField
          label="Número de DNI"
          variant="outlined"
          fullWidth
          margin="normal"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />

        {!camaraActiva ? (
          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              bgcolor: "#1E3A8A",
              "&:hover": { bgcolor: "#172554" },
            }}
            onClick={() => setCamaraActiva(true)}
          >
            Activar Cámara
          </Button>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: "user" }}
              style={{
                marginTop: "10px",
                borderRadius: "10px",
                border: "2px solid #1E3A8A",
              }}
            />
            <Button
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                bgcolor: "#2563EB",
                "&:hover": { bgcolor: "#1E40AF" },
              }}
              onClick={captureAndSend}
            >
              Capturar y Validar
            </Button>
          </>
        )}

        <Typography mt={2} color={message.includes("correcta") ? "green" : "error"}>
          {message}
        </Typography>
      </Paper>
    </Box>
  );
}
