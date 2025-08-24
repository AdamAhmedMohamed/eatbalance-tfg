import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import About from './components/About/About';
import Alimentos from './components/Alimentos/Alimentos';
import NotFound from './components/pages/NotFound';
import Footer from './components/Home/Footer/Footer';
import ScrollToTop from './components/hooks/scrollToTop';
import Contact from './components/Contact/Contact';
import CalcularPlan from './components/Herramientas/CalcularPlan';
import GenerarMenus from './components/Herramientas/GenerarMenus';
import ResumenHerramientas from './components/Herramientas/ResumenHerramientas';
import ChatbotWidget from './components/Chatbot/Chatbot'; // Importa il tuo chatbot



const App = () => {
  const footerRef = useRef(null); // Crea un riferimento per il footer

  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth' }); // Scrolla al footer
    }
  };

  return (
    <Router>
      <Navbar scrollToFooter={scrollToFooter} /> {/* Passa la funzione al Navbar */}
      <ScrollToTop/>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/About" element={<About />} />
          <Route path="/Partnership" element={<Alimentos />} /> {/* Aggiungi WorkingProcess */}
          <Route path="*" element={<NotFound />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/curso" element={<CalcularPlan />} />
          <Route path="/bdd-automatizacion" element={<GenerarMenus />} />
          <Route path="/resumen" element={<ResumenHerramientas />} /> {/* Ruta para el componente Resumen */}
        </Routes>
      </div>
      <ChatbotWidget />
      <Footer ref={footerRef} /> {/* Usa il riferimento per il footer */}
    </Router>
  );
};

export default App;
