import React, { useEffect, useState } from "react";
import "./BotSaludoAnimado.css";
import botellaImg from "../../assets/assets-seguridad/botellacmf.webp";

function BotSaludoAnimado() {
  const [visible, setVisible] = useState(false);
  const [fechaHora, setFechaHora] = useState(new Date());
  const [fraseActual, setFraseActual] = useState(0);
  const [cicloActual, setCicloActual] = useState(0);

  const frasesSeguridadCMF = [
    "Bienvenidos. ¡La seguridad la hacemos todos!",
    "Si necesitas atención médica, avísanos para ayudarte.",
    "La seguridad es nuestro compromiso. Recuerda usar tu EPP (Equipo de Protección Personal).",
    "Tu seguridad es prioridad. Reporta cualquier peligro inmediatamente.",
    "En Envases CMF, la seguridad es primero. Mantén tu área de trabajo limpia y ordenada.",
    "Recuerda: Cero accidentes es nuestro objetivo.",
    "Cada paso que das importa. Mantén una postura segura y respeta las normas.",
    "La seguridad no es negociable. Usa tus equipos de protección en todo momento.",
    "Juntos cuidamos a nuestro equipo. Si ves algo inseguro, ¡dilo!",
    "Una lesión es prevenible. Sigue los procedimientos siempre."
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
        {frasesSeguridadCMF[fraseActual]}
      </div>
    </div>
  );
}
 
export default BotSaludoAnimado;