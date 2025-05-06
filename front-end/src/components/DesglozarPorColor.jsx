import { useState, useEffect } from "react";
import CrearColor from "./CrearColor";
import Select from 'react-select';

function DesglozarPorcolor({ producto, colores, coloresOptions = [], onColoresAsignadosChange, onCantidadRestanteChange, onColorCreated }) {
    const [cantidadAsignada, setCantidadAsignada] = useState('');
    const [cantidadRestante, setCantidadRestante] = useState(producto.cantidad);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [colorSeleccionado, setColorSeleccionado] = useState(null);
    const [localColoresOptions, setLocalColoresOptions] = useState([]);
    
    // Actualizar las opciones locales cuando cambian los colores
    useEffect(() => {
        if (coloresOptions && coloresOptions.length > 0) {
            setLocalColoresOptions(coloresOptions);
        } else {
            const options = colores.map(color => ({
                value: color.idColor.toString(),
                label: color.nombre + (color.codigoInterno ? ` (${color.codigoInterno})` : ''),
                data: color
            }));
            setLocalColoresOptions(options);
        }
    }, [colores, coloresOptions]);

    const agregarColor = () => {
        if (!colorSeleccionado) {
            alert("Debes seleccionar un color.");
            return;
        }
        
        // Convertir la cantidad asignada a número para validaciones
        const cantidadAsignadaNum = parseFloat(cantidadAsignada);
        
        if (cantidadAsignadaNum <= cantidadRestante && cantidadAsignadaNum > 0) {
            // Restar la cantidad asignada de la cantidad restante
            const nuevaCantidadRestante = cantidadRestante - cantidadAsignadaNum;
            setCantidadRestante(nuevaCantidadRestante);

            // Agregar el color y la cantidad asignada a la lista
            const nuevosColoresAsignados = [
                ...coloresAsignados,
                { color: parseInt(colorSeleccionado.value), cantidad: cantidadAsignadaNum },
            ];
            setColoresAsignados(nuevosColoresAsignados);

            // Notificar al componente padre sobre los cambios
            onColoresAsignadosChange(nuevosColoresAsignados);
            onCantidadRestanteChange(nuevaCantidadRestante);

            // Reiniciar el input de cantidad asignada y el color seleccionado
            setCantidadAsignada('');
            setColorSeleccionado(null);
        } else {
            alert("La cantidad asignada no puede ser mayor que la cantidad restante o menor que 1.");
        }
    };

    // Manejar la creación de un nuevo color
    const handleColorCreated = (nuevoColor) => {
        // Notificar al componente padre
        if (onColorCreated) {
            onColorCreated(nuevoColor);
        }
        
        // Crear una nueva opción para el Select
        const newOption = {
            value: nuevoColor.idColor.toString(),
            label: nuevoColor.nombre + (nuevoColor.codigoInterno ? ` (${nuevoColor.codigoInterno})` : ''),
            data: nuevoColor
        };
        
        // Actualizar las opciones locales
        setLocalColoresOptions(prev => [...prev, newOption]);
        
        // Seleccionar automáticamente el nuevo color
        setColorSeleccionado(newOption);
    };

    // Personalizar los estilos del Select
    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '38px',
            borderRadius: '4px',
            borderColor: '#ccc',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#aaa'
            }
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#1976d2' : state.isFocused ? '#e6f7ff' : null,
            color: state.isSelected ? 'white' : 'black',
            padding: '8px 12px'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#aaa'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#333'
        })
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, marginBottom: '10px' }}>
                            <Select
                                options={localColoresOptions}
                                value={colorSeleccionado}
                                onChange={setColorSeleccionado}
                                placeholder="Buscar o seleccionar color..."
                                isClearable
                                isSearchable
                                styles={customStyles}
                                noOptionsMessage={() => "No se encontraron colores"}
                            />
                        </div>
                        <CrearColor onColorCreated={handleColorCreated} />
                    </div>
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
                        onChange={(e) => setCantidadAsignada(e.target.value)}
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
                    {coloresAsignados.map((item, index) => {
                        const colorInfo = colores.find((c) => c.idColor === item.color);
                        return (
                            <div key={index} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                padding: '8px', 
                                backgroundColor: '#f9f9f9', 
                                marginBottom: '5px',
                                borderRadius: '4px'
                            }}>
                                <span style={{ fontWeight: 'bold' }}>
                                    {colorInfo?.nombre || 'Sin color'} 
                                    {colorInfo?.codigoInterno && <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '5px' }}>
                                        ({colorInfo.codigoInterno})
                                    </span>}
                                </span>
                                <span>Cantidad: {item.cantidad} {producto.unidad}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default DesglozarPorcolor;
