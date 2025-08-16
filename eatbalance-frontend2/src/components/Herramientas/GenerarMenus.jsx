import React, { useEffect } from "react";
import "./GenerarMenus.css";

const GenerarMenus = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    const elements = document.querySelectorAll(".slide-in-zoom");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="curso-bdd">
      {/* Hero Section */}
      <div className="hero-section slide-in-zoom">
        <img
          src="/"
          alt=""
          className="hero-image"
        />
        <h1 className="hero-title"></h1>
        <p className="hero-subtitle" style={{ color: 'white' }}>
          
        </p>
      </div>

      {/* Modules Section */}
      <div className="modules-section slide-in-zoom">
        <h2></h2>
        <ul>
          
        </ul>
      </div>

      {/* Instructor Section */}
      <div className="instructor-section slide-in-zoom">
        <h2></h2>
        <p>
          
        </p>
      </div>

      {/* Details Section */}
      <div className="details-section slide-in-zoom">
        <h2></h2>
        <ul>
          
        </ul>
      </div>

      {/* Contact Section */}
      <div className="contact-section slide-in-zoom">
        <h2></h2>
        <p>
          
        </p>
        
      </div>
    </div>
  );
};

export default GenerarMenus;
