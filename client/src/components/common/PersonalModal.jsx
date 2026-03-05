import { useNavigate } from "react-router-dom";
import { FaBuilding, FaUsers, FaTimes } from "react-icons/fa";

function PersonalModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleOptionClick = (option) => {
    if (option === "departamentos") {
      navigate("/departamentos");
    } else if (option === "trabajadores") {
      navigate("/trabajadores", { state: { fromHome: true } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
      <div className="flex flex-col gap-8 items-center justify-center px-8 py-12 max-w-4xl w-full">
        <button
          onClick={() => handleOptionClick("departamentos")}
          className="group flex-1 bg-white bg-opacity-95 backdrop-blur-md rounded-3xl p-12 text-center shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-purple-200 hover:border-purple-400"
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-full w-24 h-24 flex items-center justify-center group-hover:from-purple-600 group-hover:to-violet-700 transition-all duration-300 shadow-lg">
              <FaBuilding className="text-white text-4xl" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Buscar por Departamento</h3>
              <p className="text-gray-600 text-lg">Estructura organizacional de la empresa</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleOptionClick("trabajadores")}
          className="group flex-1 bg-white bg-opacity-95 backdrop-blur-md rounded-3xl p-12 text-center shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-teal-200 hover:border-teal-400"
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-full w-24 h-24 flex items-center justify-center group-hover:from-teal-600 group-hover:to-teal-700 transition-all duration-300 shadow-lg">
              <FaUsers className="text-white text-4xl" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Buscar por Trabajador</h3>
              <p className="text-gray-600 text-lg">Búsquedas y detalles del personal de la empresa</p>
            </div>
          </div>
        </button>

        <button
          onClick={onClose}
          className="absolute top-8 right-8 bg-white bg-opacity-90 backdrop-blur-md rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <FaTimes className="text-gray-700 text-2xl" />
        </button>
      </div>
    </div>
  );
}

export default PersonalModal;
