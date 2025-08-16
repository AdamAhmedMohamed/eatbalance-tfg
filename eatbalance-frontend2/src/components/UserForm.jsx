import { useState } from "react";

export default function UserForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    edad: "", peso: "", altura: "",
    sexo: "hombre",
    actividad: "moderado",      // ← idéntico al backend
    objetivo: "mantenimiento",  // ← idéntico al backend
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-10 space-y-4">
      {/* Edad / Peso / Altura */}
      <input type="number" name="edad"   placeholder="Edad"
             className="w-full p-2 border rounded" onChange={handleChange} required />
      <input type="number" name="peso"   placeholder="Peso (kg)"
             className="w-full p-2 border rounded" onChange={handleChange} required />
      <input type="number" name="altura" placeholder="Altura (cm)"
             className="w-full p-2 border rounded" onChange={handleChange} required />

      {/* Sexo */}
      <select name="sexo"     className="w-full p-2 border rounded" onChange={handleChange}>
        <option value="hombre">Hombre</option>
        <option value="mujer">Mujer</option>
      </select>

      {/* Actividad EXACTA */}
      <select name="actividad" className="w-full p-2 border rounded" onChange={handleChange}>
        <option value="sedentario">Sedentario</option>
        <option value="ligero">Ligera (1-2 días)</option>
        <option value="moderado">Moderada (3-4 días)</option>
        <option value="activo">Activa (5-6 días)</option>
        <option value="muy activo">Muy activa / atleta</option>
      </select>

      {/* Objetivo EXACTO */}
      <select name="objetivo" className="w-full p-2 border rounded" onChange={handleChange}>
        <option value="mantenimiento">Mantener peso</option>
        <option value="superavit">Ganar masa</option>
        <option value="deficit">Perder grasa</option>
      </select>

      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
        Calcular plan
      </button>
    </form>
  );
}
