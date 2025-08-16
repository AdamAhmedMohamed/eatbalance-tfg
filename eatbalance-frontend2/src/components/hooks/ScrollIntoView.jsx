// scrollToView.js

// Funzione per scorrere verso un elemento
export const scrollToView = (elementRef) => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // Puoi modificare il comportamento (start, center, end)
      });
    }
  };
  