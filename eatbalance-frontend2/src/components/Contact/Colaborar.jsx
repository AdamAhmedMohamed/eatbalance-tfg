// Import statements
import React from "react";
import './Contact.css';
import Swal from 'sweetalert2';

// Component definition
const Contact = () => {

    // Form submission handler
    const onSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);

        // Convert form data to JSON
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        try {
            const response = await fetch(import.meta.env.VITE_REACT_APP_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: json,
            });

            // Check if the response indicates success
            if (response.ok) {
                Swal.fire({
                    title: "Mensaje enviado con éxito!",
                    text: "Mensaje enviado!",
                    icon: "success",
                });
            } else {
                Swal.fire({
                    title: "Error al enviar el mensaje",
                    text: "Por favor, inténtelo de nuevo más tarde.",
                    icon: "error"
                });
            }
        } catch {
            Swal.fire({
                title: "Error de conexión",
                text: "No se pudo enviar el mensaje. Verifique su conexión a internet.",
                icon: "error"
            });
        }
    };

    // JSX structure
    return (
        <section className="contact">
            <form onSubmit={onSubmit}>
                <h2>COLABORA CON NOSOTROS</h2>
                <div className="input-box">
                    <label>Nombre completo</label>
                    <input type="text" className="field" placeholder="Ingrese su nombre" name="name" required />
                </div>
                <div className="input-box">
                    <label>Correo electrónico</label>
                    <input type="email" className="field" placeholder="Ingrese su correo electrónico" name="email" required />
                </div>
                <div className="input-box">
                    <label>Su mensaje</label>
                    <textarea name="message" className="field mess" placeholder="Ingrese su mensaje" required></textarea>
                </div>
                <input type="hidden" name="formType" value="colaborar" />
                <button type="submit">Enviar mensaje</button>
            </form>
        </section>
    );
};

// Export component
export default Contact;