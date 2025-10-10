import React from "react";
import { Box } from "@mui/material";

export default function Layout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url('/fondovotacion.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 2, sm: 4 }, // padding dinámico según pantalla
      }}
    >
      {children}
    </Box>
  );
}
