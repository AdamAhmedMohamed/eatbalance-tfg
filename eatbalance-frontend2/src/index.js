import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";

const GlobalObserver = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible"); // Add the class when in view
          } else {
            entry.target.classList.remove("visible"); // Remove the class when out of view
          }
        });
      },
      { threshold: 0.2 } // Trigger when 20% of the element is visible
    );

    const elements = document.querySelectorAll("*");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect(); // Cleanup observer on unmount
  }, []);

  return null;
};

ReactDOM.render(
  <>
    <GlobalObserver />
    <App />
  </>,
  document.getElementById("root")
);