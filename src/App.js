import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Voting from "./pages/Voting";
import Confirmation from "./pages/Confirmation";
import Results from "./pages/Results";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/voting" element={<Voting />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
