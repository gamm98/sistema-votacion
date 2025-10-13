import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Card, CardContent, Typography } from "@mui/material";

export default function AdminLogin() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("https://127.0.0.1:5000/api/admin/login", {
        usuario,
        contrasena,
      });

      if (res.data.success) {
        localStorage.setItem("adminToken", res.data.token);
        navigate("/admin/dashboard");
      } else {
        setMessage("Credenciales incorrectas");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error al conectar con el servidor");
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL + "/images/fondovotacion.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          background: "rgba(255,255,255,0.93)",
          borderRadius: "20px",
          padding: "25px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
        }}
      >
        <Typography variant="h5" sx={{ color: "#0D47A1", fontWeight: "bold" }}>
          🔐 Acceso Administrador
        </Typography>

        <TextField
          fullWidth
          label="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          type="password"
          label="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          margin="normal"
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          sx={{ marginTop: "15px" }}
        >
          Ingresar
        </Button>

        {message && (
          <Typography
            variant="body1"
            sx={{ color: "red", marginTop: "10px", fontWeight: "bold" }}
          >
            {message}
          </Typography>
        )}
        {/*Botón para volver al inicio */}
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mt: 3 }}
          onClick={() => navigate("/")}
        >
          ← Volver al inicio
        </Button>
      </Card>
    </div>
  );
}
