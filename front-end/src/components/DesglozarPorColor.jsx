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
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '10px' }}>
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Cantidad disponible:</label>
                    <span>{cantidadRestante}/{producto.cantidad} {producto.unidad}</span>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Color:</label>
                    <select 
                        style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
                        onChange={(e) => setColorSeleccionado(parseInt(e.target.value))}
                    >
                        <option value={0}>Sin color</option>
                        {colores.map((color) => (
                            <option key={color.idColor} value={color.idColor}>
                                {color.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cantidad a asignar:</label>
                    <input
                        style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        max={cantidadRestante}
                        value={cantidadAsignada}
                        onChange={(e) => setCantidadAsignada(parseInt(e.target.value) || 0)}
                    />
                </div>
                
                <button 
                    style={{ 
                        padding: '8px 15px', 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
                    onClick={agregarColor}
                >
                    Agregar color
                </button>
            </div>

            {coloresAsignados.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Colores asignados:</h4>
                    {coloresAsignados.map((item, index) => (
                        <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '8px', 
                            backgroundColor: '#f9f9f9', 
                            marginBottom: '5px',
                            borderRadius: '4px'
                        }}>
                            <span style={{ fontWeight: 'bold' }}>{colores.find((c) => c.idColor === item.color)?.nombre || 'Sin color'}</span>
                            <span>Cantidad: {item.cantidad} {producto.unidad}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DesglozarPorcolor;