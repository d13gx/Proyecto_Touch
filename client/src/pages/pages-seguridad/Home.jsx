import Logo from '../assets/logo-cmf-azul.svg';
import Carousel from '../components/Carousel';
import BotSaludoAnimado from '../components/BotSaludoAnimado';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import carrusel1 from '../assets/carrusel_1.webp';
import carrusel2 from '../assets/carrusel_2.webp';
import carrusel3 from '../assets/carrusel_3.webp';
import carrusel4 from '../assets/carrusel_4.webp';
import VideoButton from '../components/VideoButton';

function Home() {
  const carouselImages = [
    carrusel1,
    carrusel2,
    carrusel3,
    carrusel4
  ];

  const navigate = useNavigate();

  const handleVideoClick = () => {
    navigate('/video-seguridad');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-4">
          <div>
            <img src={Logo} alt="CMF Envases" className="h-28 md:h-36 object-contain" />
            <p className="text-sm text-gray-600"></p>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-12">
          <BotSaludoAnimado />

          <div className="animate-fade-in">
            <Carousel images={carouselImages} />
          </div>

          <div>
            <h2 className="text-6xl font-bold text-center text-gray-800">¿Quieres Ingresar a Planta?</h2>
          </div>

          <div className="flex justify-center animate-fade-in-delay">
            <VideoButton onClick={handleVideoClick} />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
