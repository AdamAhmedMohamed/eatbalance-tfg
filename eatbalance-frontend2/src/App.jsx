import React, { useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./components/Home/Home";
import About from "./components/About/About";
import Alimentos from "./components/Alimentos/Alimentos";
import NotFound from "./components/pages/NotFound";
import Footer from "./components/Home/Footer/Footer";
import ScrollToTop from "./components/hooks/scrollToTop";
import Contact from "./components/Contact/Contact";
import CalcularPlan from "./components/Herramientas/CalcularPlan";
import GenerarMenus from "./components/Herramientas/GenerarMenus";
import ResumenHerramientas from "./components/Herramientas/ResumenHerramientas";
import ChatbotWidget from "./components/Chatbot/Chatbot";

// ⬇️ NUEVO
import Welcome from "./components/pages/Welcome";
import ProtectedRoute from "./components/ProtectedRoute"; // asegúrate de que redirige a /welcome

const App = () => {
  const footerRef = useRef(null);

  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Router>
      <Navbar scrollToFooter={scrollToFooter} />
      <ScrollToTop />
      <div>
        <Routes>
          {/* Pública */}
          <Route path="/welcome" element={<Welcome />} />

          {/* Privadas (piden login; si no hay token → /welcome) */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/About" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/Partnership" element={<ProtectedRoute><Alimentos /></ProtectedRoute>} />
          <Route path="/Contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/curso" element={<ProtectedRoute><CalcularPlan /></ProtectedRoute>} />
          <Route path="/bdd-automatizacion" element={<ProtectedRoute><GenerarMenus /></ProtectedRoute>} />
          <Route path="/resumen" element={<ProtectedRoute><ResumenHerramientas /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <ChatbotWidget />
      <Footer ref={footerRef} />
    </Router>
  );
};

export default App;
