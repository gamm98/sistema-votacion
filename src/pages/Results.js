import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Container,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

export default function Results() {
  const [results, setResults] = useState([]);

  const fetchResults = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/results");
      const formatted = Object.entries(response.data).map(([name, votos]) => ({
        name,
        votos,
      }));
      setResults(formatted);
    } catch (error) {
      console.error("Error al obtener resultados", error);
    }
  };

  useEffect(() => {
    fetchResults(); // Cargar inicialmente
    const interval = setInterval(fetchResults, 2000); // Actualizar cada 2s
    return () => clearInterval(interval);
  }, []);

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
        <Typography
          variant="h4"
          fontWeight="bold"
          color="#1E3A8A"
          gutterBottom
        >
          Resultados en Tiempo Real
        </Typography>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={results}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="votos" fill="#1E3A8A" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Container>
  );
}
