import Carousel from '../../components/components-seguridad/Carousel';
import BotSaludoAnimado from '../../components/components-seguridad/BotSaludoAnimado';
import { useNavigate } from 'react-router-dom';
import carrusel1 from '../../assets/assets-seguridad/carrusel_1.webp';
import carrusel2 from '../../assets/assets-seguridad/carrusel_2.webp';
import carrusel3 from '../../assets/assets-seguridad/carrusel_3.webp';
import carrusel4 from '../../assets/assets-seguridad/carrusel_4.webp';
import VideoButton from '../../components/components-seguridad/VideoButton';

function Home() {
  const carouselImages = [
    carrusel1,
    carrusel2,
    carrusel3,
    carrusel4
  ];

  const navigate = useNavigate();

  const handleVideoClick = () => {
    navigate('/seguridad/video-seguridad');
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-12">
          <div className="animate-fade-in">
            <Carousel images={carouselImages} />
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-center text-gray-800">¡Para Ingresar a Planta tienes que ver el video!</h2>
            </div>

            <div className="flex justify-center animate-fade-in-delay">
              <VideoButton onClick={handleVideoClick} />
            </div>
          </div>

          <BotSaludoAnimado />

        </div>
      </main>
    </div>
  );
}

export default Home;
