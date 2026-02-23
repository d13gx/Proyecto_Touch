import axios from 'axios';

export const getALLTrabajadores = async () => {
    return axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/trabajadores/`)
}