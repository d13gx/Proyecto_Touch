import { useEffect } from "react"; 
import { getALLTrabajadores } from "../api/trabajadores.api";

export function Trabajadores() {
    const {trabajadores, setTrabajadores} = useState([]);

    useEffect(() => {
        function loadTrabajadores() {
            const res = getALLTrabajadores();
            console.log(res);
        }
        loadTrabajadores();
    }, []);

    return (
        <div>
            <h1>Trabajadores</h1>
        </div>
    );
}