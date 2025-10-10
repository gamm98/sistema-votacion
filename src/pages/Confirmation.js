import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCandidate } = location.state || {};

  const handleConfirm = () => {
    alert(`Voto registrado para ${selectedCandidate.name}`);
    navigate("/"); // regresar al login o página de inicio
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
      <Paper sx={{ padding: 4, width: 400, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Confirmar Voto
        </Typography>
        {selectedCandidate ? (
          <>
            <Typography>
              Has seleccionado: <strong>{selectedCandidate.name}</strong>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 3 }}
              onClick={handleConfirm}
            >
              Confirmar y Enviar
            </Button>
          </>
        ) : (
          <Typography>No hay candidato seleccionado.</Typography>
        )}
      </Paper>
    </Box>
  );
}
