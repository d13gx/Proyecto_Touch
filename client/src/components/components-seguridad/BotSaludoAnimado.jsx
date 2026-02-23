import React, { useEffect, useState } from "react";
import "./BotSaludoAnimado.css";
import botellaImg from "../assets/botellacmf.webp";

function BotSaludoAnimado() {
  const [visible, setVisible] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [fraseActual, setFraseActual] = useState(0);
  const [cicloActual, setCicloActual] = useState(0);

  const frasesSeguridadCMF = [
    "¡Hola! La seguridad es nuestro compromiso. Recuerda usar tu EPP (Equipo de Protección Personal).",
    "¡Bienvenido! Tu seguridad es prioridad. Reporta cualquier peligro inmediatamente.",
    "¡Hola! En CMF Envases, la seguridad primero. Mantén tu área de trabajo limpia y ordenada.",
    "¡Bienvenido a la planta! Recuerda: cero accidentes es nuestro objetivo.",
    "¡Hola! Cada paso que das importa. Mantén una postura segura y respeta las normas.",
    "¡Bienvenido! La seguridad no es negociable. Usa tus equipos de protección en todo momento.",
    "¡Hola! Juntos cuidamos a nuestro equipo. Si ves algo inseguro, ¡dilo!",
    "¡Bienvenido! Recuerda: una lesión es prevenible. Sigue los procedimientos siempre."
  ];
 
  useEffect(() => {
    setVisible(true); // Fade IN al montar
    const reloj = setInterval(() => setFechaHora(new Date()), 1000);
    
    // Ciclo de desaparecer y aparecer con nueva frase
    const cicloAnimacion = setInterval(() => {
      // Desaparecer
      setVisible(false);
      
      // Después de 500ms, cambiar frase y aparecer
      setTimeout(() => {
        setFraseActual((prev) => (prev + 1) % frasesSeguridadCMF.length);
        setCicloActual((prev) => prev + 1);
        setVisible(true);
      }, 500);
    }, 8000); // Cada 8 segundos: desaparece y aparece con nueva frase

    return () => {
      clearInterval(reloj);
      clearInterval(cicloAnimacion);
    };
  }, [frasesSeguridadCMF.length]);
 
  return (
    <div className={`bot-saludo-avatar fade ${visible ? "visible" : "hidden"}`}>
      <div className="avatar-container">
        <img
          src={botellaImg}
          alt="Asistente virtual"
          className="avatar-bot"
        />
      </div>
      <div>
        {frasesSeguridadCMF[fraseActual]}<br />
        Hoy es: <strong>{fechaHora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><br />
        y son las: <strong>{fechaHora.getHours()}:{fechaHora.getMinutes().toString().padStart(2, '0')}</strong>
      </div>
    </div>
  );
}
 
export default BotSaludoAnimado;