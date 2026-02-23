import React, { useState, useEffect } from "react";
import halloweenImg from "./assets/halloween-cmf6.jpg";

const targetDate = new Date("2025-10-30T00:00:00");

function getTimeRemaining() {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function HalloweenCountdown() {
  useEffect(() => {
    const linkNosifer = document.createElement("link");
    linkNosifer.href = "https://fonts.googleapis.com/css2?family=Nosifer&display=swap";
    linkNosifer.rel = "stylesheet";
    document.head.appendChild(linkNosifer);

    const linkSpecialElite = document.createElement("link");
    linkSpecialElite.href = "https://fonts.googleapis.com/css2?family=Special+Elite&display=swap";
    linkSpecialElite.rel = "stylesheet";
    document.head.appendChild(linkSpecialElite);

    const linkCreepster = document.createElement("link");
    linkCreepster.href = "https://fonts.googleapis.com/css2?family=Creepster&display=swap";
    linkCreepster.rel = "stylesheet";
    document.head.appendChild(linkCreepster);

    return () => {
      document.head.removeChild(linkNosifer);
      document.head.removeChild(linkSpecialElite);
      document.head.removeChild(linkCreepster);
    };
  }, []);

  const [time, setTime] = useState(getTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const containerStyle = {
    height: "100vh",
    width: "100%",
    backgroundImage: `url(${halloweenImg})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center center",
    backgroundColor: "#000",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "3rem 2rem",
    boxSizing: "border-box",
    textAlign: "center",
    overflow: "hidden",
  };

  const headingStyle = {
    fontFamily: "'Nosifer', cursive",
    fontSize: "clamp(4rem, 7vw, 8rem)",
    marginBottom: "3.5rem",
    letterSpacing: "1px",
    animation: "fadeIn 2.5s ease-out, glow 3s ease-in-out infinite alternate",
  };

  const paragraphStyle = {
    fontFamily: "'Special Elite', cursive",
    fontSize: "clamp(2.1rem, 3vw, 1.5rem)",
    marginBottom: "7rem",
    maxWidth: "900px",
    lineHeight: "2.5",
    color: "#FF7518",
    marginLeft: "auto",  // Agregado
    marginRight: "auto", // Agregado
	animation: "flicker 6s infinite alternate",
  };


  const countdownStyle = {
    fontFamily: "'Creepster', cursive",
    fontSize: "clamp(2rem, 4vw, 4rem)",
    fontWeight: "bold",
    color: "#FFA500",
    marginTop: "2rem",
    animation: "pulse 2s ease-in-out infinite",
  };

  const footerStyle = {
    fontFamily: "'Special Elite', cursive",
    fontSize: "clamp(1.5rem, 2.5vw, 3rem)",
    marginTop: "4rem",
    color: "#FF7518",
    textShadow: "1px 1px 8px #FF4500, 0 0 20px #FFD700",
    animation: "hauntedLight 0.4s infinite alternate",
  };

  return (
    <>
      <style>
        {`
          @keyframes glow {
            from {
              text-shadow: 0 0 15px #FF7518,
                           0 0 25px #FF7518,
                           0 0 35px #FF4500;
            }
            to {
              text-shadow: 0 0 30px #FFD700,
                           0 0 40px #FF8C00,
                           0 0 50px #FF4500;
            }
          }
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          @keyframes flicker {
            0%, 18%, 22%, 25%, 53%, 57%, 100% {
              opacity: 1;
            }
            20%, 24%, 55% {
              opacity: 0.5;
            }
          }
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: translateY(-30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes hauntedLight {
            0% {
              text-shadow: none;
            }
            25% {
              text-shadow: 0 0 10px #FF4500, 0 0 20px #FF8C00, 0 0 30px #FFD700;
            }
            50% {
              text-shadow: none;
            }
            75% {
              text-shadow: 0 0 10px #FF4500, 0 0 20px #FF8C00, 0 0 30px #FFD700;
            }
            100% {
              text-shadow: none;
            }
          }
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
          }
        `}
      </style>

      <div style={containerStyle}>
        {/* Principal */}
        <div>
          <h1 style={headingStyle}>¡Algo nuevo está por llegar!</h1>
          <p style={paragraphStyle}>
            Pronto, un secreto se revelará… ¿te imaginas lo que se
            esconde detrás de este misterioso totem?
          </p>
		  <h2 style={countdownStyle}>
            NO TE LO PIERDAS... ESTE JUEVES SE DESCUBRIRÁ EL MISTERIO
          </h2>
        </div>
        {/* Pie de página */}
        <div style={footerStyle}>
          Departamento de Tecnología y Digitalización
        </div>
      </div>
    </>
  );
}

export default HalloweenCountdown;
