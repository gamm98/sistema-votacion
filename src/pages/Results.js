import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Grid } from "@mui/material";

export default function Results() {
  const [results, setResults] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("⚠️ No tienes permisos para ver los resultados.");
        return;
      }

      try {
        const response = await axios.get("http://127.0.0.1:5000/api/results", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(response.data);
      } catch (err) {
        console.error(err);
        setError("❌ Error al obtener resultados. Verifica tu sesión o servidor.");
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-100 to-green-300 p-6">
      <Typography variant="h4" gutterBottom className="font-bold text-green-800">
        Resultados de la Votación
      </Typography>

      {error && (
        <Typography variant="body1" color="error" style={{ marginTop: "10px" }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3} justifyContent="center">
        {Object.entries(results).map(([candidato, votos]) => (
          <Grid item xs={12} sm={6} md={4} key={candidato}>
            <Card className="shadow-lg">
              <CardContent className="text-center">
                <Typography variant="h6">{candidato}</Typography>
                <Typography variant="h5" color="primary">
                  🗳️ {votos} votos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
