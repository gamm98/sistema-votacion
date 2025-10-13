import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  TextField,
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [data, setData] = useState([]);
  const [correo, setCorreo] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://127.0.0.1:5000/api/admin/results", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error al obtener resultados:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // 🔁 Actualiza cada 5 seg
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleSendReport = async () => {
    if (!correo) return alert("Ingrese un correo válido.");
    try {
      const res = await axios.post(
        "https://127.0.0.1:5000/api/admin/send_report",
        { correo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert(res.data.message);
    } catch (error) {
      console.error(error);
      alert("Error al enviar el correo.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `url(${process.env.PUBLIC_URL + "/images/fondovotacion.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        p: 4,
      }}
    >
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="white" fontWeight="bold">
          🧾 Panel del Administrador
        </Typography>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </Box>

      {/* Gráficos */}
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" textAlign="center" gutterBottom>
                Distribución de votos (Gráfico Circular)
              </Typography>
              <PieChart width={400} height={300}>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="candidato"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" textAlign="center" gutterBottom>
                Comparativa por Candidato (Gráfico de Barras)
              </Typography>
              <BarChart width={400} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="candidato" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#82ca9d" />
              </BarChart>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Envío de reporte */}
      <Card sx={{ mt: 5, borderRadius: 3, p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h6" textAlign="center" mb={2}>
          📤 Enviar Reporte de Resultados por Correo
        </Typography>
        <TextField
          fullWidth
          label="Correo destino"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button fullWidth variant="contained" color="primary" onClick={handleSendReport}>
          Enviar Reporte
        </Button>
      </Card>
    </Box>
  );
}
