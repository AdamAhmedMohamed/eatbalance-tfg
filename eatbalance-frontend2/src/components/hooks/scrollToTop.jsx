// ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation(); // Ottieni la location attuale della route

  useEffect(() => {
    window.scrollTo(0, 0); // Scrolla in cima quando la route cambia
  }, [location]); // Esegui l'effetto ogni volta che la location cambia

  return null; // Questo componente non renderizza nulla
};

export default ScrollToTop;
