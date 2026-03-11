import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-inner border-t border-blue-400/30">
            <div className="max-w-7xl mx-auto">
                <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
                    <div className="text-center lg:text-center flex-1">
                        <p className="text-blue-200 text-base sm:text-lg lg:text-xl font-semibold mb-2">
                            © {new Date().getFullYear()} Todos los derechos reservados
                        </p>
                        <p className="text-blue-300 text-sm sm:text-base lg:text-lg">
                            Departamento de Tecnología y Digitalización
                        </p>
                    </div>

                    <div className="text-center lg:text-right flex-1">
                        <div className="flex flex-col items-center lg:items-end gap-2">
                            <span className="text-blue-200 text-sm sm:text-base lg:text-lg font-medium">
                                v2.0.0
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
