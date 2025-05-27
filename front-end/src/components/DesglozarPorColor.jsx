import { useState, useEffect } from "react";
import CrearColor from "./CrearColor";
import Select from 'react-select';
import axios from 'axios';

function DesglozarPorcolor({ producto, colores, coloresOptions = [], onColoresAsignadosChange, onCantidadRestanteChange, onColorCreated }) {
    const [cantidadAsignada, setCantidadAsignada] = useState('');
    const [cantidadRestante, setCantidadRestante] = useState(producto.cantidad);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [colorSeleccionado, setColorSeleccionado] = useState(null);
    const [localColoresOptions, setLocalColoresOptions] = useState([]);
    
    // Estados para manejo de cantidad alternativa
    const [cantidadAlternativaAsignada, setCantidadAlternativaAsignada] = useState('');
    const [cantidadAlternativaRestante, setCantidadAlternativaRestante] = useState(producto.cantidadAlternativa || 0);
    const [mostrarCantidadAlternativa, setMostrarCantidadAlternativa] = useState(!!producto.cantidadAlternativa);
    
    // Guardar el tipo de bulto basado en la unidad del producto para enviarlo al backend
    const tipoBulto = producto.unidad === 'm' || producto.unidad === 'kg' ? 'rollo' : 'caja';
    
    // Actualizar las opciones locales cuando cambian los colores - solo una vez al inicio
    useEffect(() => {
        if (coloresOptions && coloresOptions.length > 0) {
            setLocalColoresOptions(coloresOptions);
        } else if (colores && colores.length > 0) {
            const options = colores.map(color => ({
                value: color.idColor.toString(),
                label: color.nombre + (color.codigoInterno ? ` (${color.codigoInterno})` : ''),
                data: color
            }));
            setLocalColoresOptions(options);
        }
    }, []);  // Dependencias vacías para que solo se ejecute una vez



    const agregarColor = () => {
        if (!colorSeleccionado) {
            alert("Debes seleccionar un color.");
            return;
        }
        
        // Convertir la cantidad asignada a número para validaciones
        const cantidadAsignadaNum = parseFloat(cantidadAsignada);
        
        // Validar cantidad principal
        if (cantidadAsignadaNum <= cantidadRestante && cantidadAsignadaNum > 0) {
            // Validar cantidad alternativa si está habilitada
            let cantidadAltAsignadaNum = 0;
            if (mostrarCantidadAlternativa) {
                cantidadAltAsignadaNum = parseFloat(cantidadAlternativaAsignada || 0);
                if (cantidadAltAsignadaNum <= 0 || cantidadAltAsignadaNum > cantidadAlternativaRestante) {
                    alert("La cantidad alternativa debe ser mayor que 0 y no puede superar la cantidad alternativa restante.");
                    return;
                }
            }
            
            // Restar la cantidad asignada de la cantidad restante
            const nuevaCantidadRestante = cantidadRestante - cantidadAsignadaNum;
            setCantidadRestante(nuevaCantidadRestante);
            
            // Restar la cantidad alternativa si está habilitada
            if (mostrarCantidadAlternativa && cantidadAltAsignadaNum > 0) {
                const nuevaCantidadAltRestante = cantidadAlternativaRestante - cantidadAltAsignadaNum;
                setCantidadAlternativaRestante(nuevaCantidadAltRestante);
            }

            // Agregar el color y las cantidades asignadas a la lista
            const nuevosColoresAsignados = [
                ...coloresAsignados,
                { 
                    color: parseInt(colorSeleccionado.value), 
                    cantidad: cantidadAsignadaNum,
                    cantidadAlternativa: mostrarCantidadAlternativa ? cantidadAltAsignadaNum : null,
                    rollos: [{ cantidad: cantidadAsignadaNum, numero: 1 }]
                },
            ];
            setColoresAsignados(nuevosColoresAsignados);

            // Notificar al componente padre sobre los cambios
            onColoresAsignadosChange(nuevosColoresAsignados);
            onCantidadRestanteChange(nuevaCantidadRestante);

            // Reiniciar los inputs y el color seleccionado
            setCantidadAsignada('');
            setCantidadAlternativaAsignada('');
            setColorSeleccionado(null);
        } else {
            alert("La cantidad asignada no puede ser mayor que la cantidad restante o menor o igual a 0.");
        }
    };

    // Manejar la creación de un nuevo color
    const handleColorCreated = (nuevoColor) => {
        console.log('Color creado recibido:', nuevoColor);
        
        // Verificar que el color tenga la estructura correcta
        if (!nuevoColor || !nuevoColor.idColor) {
            console.error('El color recibido no tiene el formato correcto:', nuevoColor);
            return;
        }
        
        // Crear una nueva opción para el Select
        const newOption = {
            value: nuevoColor.idColor.toString(),
            label: nuevoColor.nombre + (nuevoColor.codigoInterno ? ` (${nuevoColor.codigoInterno})` : ''),
            data: nuevoColor
        };
        
        // Actualizar las opciones locales de forma segura
        setLocalColoresOptions(prev => {
            // Verificar si el color ya existe para evitar duplicados
            const colorExists = prev.some(opt => opt.value === newOption.value);
            if (colorExists) return prev;
            return [...prev, newOption];
        });
        
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

    const guardarDistribucion = async () => {
        try {
            if (coloresAsignados.length === 0) {
                alert("Debes asignar al menos un color.");
                return;
            }
            
            if (cantidadRestante > 0) {
                const confirmar = window.confirm(`Aún hay ${cantidadRestante} ${producto.unidad} sin asignar. ¿Deseas continuar de todas formas?`);
                if (!confirmar) return;
            }
            
            // Crear la estructura de datos para enviar al servidor
            const dataToSend = {
                producto: producto.idProducto,
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                contenedor: producto.idContenedor,
                precioPorUnidad: producto.precioPorUnidad,
                coloresAsignados: coloresAsignados.map(item => ({
                    color: item.color,
                    cantidad: item.cantidad,
                    cantidadAlternativa: item.cantidadAlternativa || null,
                    rollos: [{ cantidad: item.cantidad, numero: 1 }]
                })),
                cantidadAlternativa: producto.cantidadAlternativa,
                unidadAlternativa: producto.unidadAlternativa,
                item_proveedor: producto.item_proveedor,
                codigoInterno: producto.codigoInterno,
                tipoBulto: tipoBulto,
                // Agregar dataAnterior con la información del producto original
                dataAnterior: {
                    idContenedorProductos: producto.idContenedorProductos,
                    nombre: producto.nombre,
                    codigoInterno: producto.codigoInterno || '',
                    cantidad: producto.cantidad || 0,
                    unidad: producto.unidad || '',
                    color: producto.idColor || null
                },
                // Agregar usuario que realiza el cambio (puede tomarse del localStorage si está disponible)
                usuarioCambio: localStorage.getItem('userId') || 1,
                motivo: 'Distribución de colores'
            };
            
            // Enviar solicitud al servidor para actualizar el producto
            await axios.put(`http://localhost:5000/api/contenedorProducto/${producto.idContenedorProductos}`, dataToSend);
            
            alert("Distribución por colores guardada correctamente.");
            // Recargar la página para mostrar los cambios
            window.location.reload();
        } catch (error) {
            console.error('Error al guardar la distribución:', error);
            alert("Error al guardar la distribución. Por favor, intente nuevamente.");
        }
    };

    return (
        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '10px' }}>
            <h3 style={{ marginTop: '0', marginBottom: '15px', color: '#333' }}>Asignar colores</h3>
            
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        min="0.01"
                        max={cantidadRestante}
                        step="0.01"
                        value={cantidadAsignada}
                        onChange={(e) => setCantidadAsignada(e.target.value)}
                    />
                    <div style={{ marginBottom: '10px', color: '#666' }}>
                        Disponible: {cantidadRestante} {producto.unidad}
                    </div>
                </div>
                
                {/* Mostrar campo de cantidad alternativa si el producto la tiene */}
                {producto.cantidadAlternativa > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <input
                                type="checkbox"
                                id="mostrarCantidadAlt"
                                checked={mostrarCantidadAlternativa}
                                onChange={() => setMostrarCantidadAlternativa(!mostrarCantidadAlternativa)}
                                style={{ marginRight: '8px' }}
                            />
                            <label htmlFor="mostrarCantidadAlt" style={{ cursor: 'pointer' }}>
                                Asignar también cantidad alternativa ({producto.unidadAlternativa})
                            </label>
                        </div>
                        
                        {mostrarCantidadAlternativa && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Cantidad alternativa a asignar ({producto.unidadAlternativa}):
                                </label>
                                <input
                                    style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
                                    type="number"
                                    placeholder={`Cantidad en ${producto.unidadAlternativa}`}
                                    min="0.01"
                                    max={cantidadAlternativaRestante}
                                    step="0.01"
                                    value={cantidadAlternativaAsignada}
                                    onChange={(e) => setCantidadAlternativaAsignada(e.target.value)}
                                />
                                <div style={{ marginBottom: '10px', color: '#666' }}>
                                    Disponible: {cantidadAlternativaRestante} {producto.unidadAlternativa}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                

                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        style={{ 
                            padding: '8px 15px', 
                            backgroundColor: '#4CAF50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            flex: '1'
                        }}
                        onClick={agregarColor}
                    >
                        Agregar color
                    </button>
                    
                    <button 
                        style={{ 
                            padding: '8px 15px', 
                            backgroundColor: '#2196F3', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            flex: '1',
                            opacity: coloresAsignados.length === 0 ? '0.5' : '1'
                        }}
                        onClick={guardarDistribucion}
                        disabled={coloresAsignados.length === 0}
                    >
                        Guardar
                    </button>
                </div>
            </div>

            {coloresAsignados.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                    <h4 style={{ marginBottom: '10px' }}>Colores asignados:</h4>
                    {coloresAsignados.map((item, index) => {
                        const colorInfo = colores.find((c) => c.idColor === item.color);
                        return (
                            <div key={index} style={{ 
                                padding: '8px', 
                                backgroundColor: '#f9f9f9', 
                                marginBottom: '10px',
                                borderRadius: '4px'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    marginBottom: '5px'
                                }}>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {colorInfo?.nombre || 'Sin color'} 
                                        {colorInfo?.codigoInterno && <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '5px' }}>
                                            ({colorInfo.codigoInterno})
                                        </span>}
                                    </span>
                                    <div>
                                    <span>Cantidad: {item.cantidad} {producto.unidad}</span>
                                    {item.cantidadAlternativa && (
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            ({item.cantidadAlternativa} {producto.unidadAlternativa})
                                        </span>
                                    )}
                                </div>
                                </div>
                                
                
                                
                                {/* Botón para eliminar el color asignado */}
                                <button 
                                    onClick={() => {
                                        // Devolver la cantidad a la cantidad restante
                                        setCantidadRestante(cantidadRestante + item.cantidad);
                                        
                                        // Eliminar el color de la lista
                                        const nuevosColoresAsignados = coloresAsignados.filter((_, i) => i !== index);
                                        setColoresAsignados(nuevosColoresAsignados);
                                        
                                        // Notificar al componente padre
                                        onColoresAsignadosChange(nuevosColoresAsignados);
                                        onCantidadRestanteChange(cantidadRestante + item.cantidad);
                                    }}
                                    style={{ 
                                        padding: '3px 8px',
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '0.8em',
                                        marginTop: '5px'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default DesglozarPorcolor;
