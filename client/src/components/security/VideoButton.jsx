import { FaPlay } from "react-icons/fa";

export default function VideoButton({ onClick }) {
  const buttonStyle = {
    padding: '20px 66px',
    fontSize: '1.8rem',
    minWidth: '560px',
    maxWidth: '500px',
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-6 md:gap-10 font-extrabold overflow-hidden w-full justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <FaPlay size={68} className="relative z-10" />

      <span className="relative z-10" style={{ fontSize: 'inherit' }}>
        Video de Seguridad 
      </span>
    </button>
  );
}
