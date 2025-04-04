import { useState } from "react";

function DesglozarPorcolor({ producto, colores, onColoresAsignadosChange, onCantidadRestanteChange }) {
    const [cantidadAsignada, setCantidadAsignada] = useState(0);
    const [cantidadRestante, setCantidadRestante] = useState(producto.cantidad);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [colorSeleccionado, setColorSeleccionado] = useState(0);

    const agregarColor = () => {
        if (cantidadAsignada <= cantidadRestante && cantidadAsignada > 0) {
            // Restar la cantidad asignada de la cantidad restante
            const nuevaCantidadRestante = cantidadRestante - cantidadAsignada;
            setCantidadRestante(nuevaCantidadRestante);

            // Agregar el color y la cantidad asignada a la lista
            const nuevosColoresAsignados = [
                ...coloresAsignados,
                { color: colorSeleccionado, cantidad: cantidadAsignada },
            ];
            setColoresAsignados(nuevosColoresAsignados);

            // Notificar al componente padre sobre los cambios
            onColoresAsignadosChange(nuevosColoresAsignados);
            onCantidadRestanteChange(nuevaCantidadRestante);

            // Reiniciar el input de cantidad asignada
            setCantidadAsignada(0);
        } else {
            alert("La cantidad asignada no puede ser mayor que la cantidad restante o menor que 1.");
        }
    };

    return (
        <div>
            <label>Cantidad: {cantidadRestante}/{producto.cantidad}</label>
            <label>Color:</label>
            <select onChange={(e) => setColorSeleccionado(parseInt(e.target.value))}>
                <option value={0}>Sin color</option>
                {colores.map((color) => (
                    <option key={color.idColor} value={color.idColor}>
                        {color.nombre}
                    </option>
                ))}
            </select>
            <input
                type="number"
                placeholder="Cantidad"
                min="1"
                max={cantidadRestante}
                value={cantidadAsignada}
                onChange={(e) => setCantidadAsignada(parseInt(e.target.value))}
            />
            <button onClick={agregarColor}>Agregar color</button>

            {coloresAsignados.length > 0 && (
                coloresAsignados.map((item, index) => (
                    <div key={index}>
                        <label>{colores.find((c) => c.idColor === item.color)?.nombre}</label>
                        <label>Cantidad: {item.cantidad}</label>
                    </div>
                ))
            )}
        </div>
    );
}

export default DesglozarPorcolor;