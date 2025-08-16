import { useEffect } from "react";

const useAnimation = (selector, options = { threshold: 0.2 }) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible"); // Add the class when in view
            observerInstance.unobserve(entry.target); // Stop observing the element
          }
        });
      },
      options
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect(); // Cleanup observer on unmount
  }, [selector, options]);
};

export default useAnimation;