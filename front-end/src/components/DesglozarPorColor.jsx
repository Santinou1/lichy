import { useState, useEffect } from "react";
import CrearColor from "./CrearColor";
import Select from 'react-select';
import axios from 'axios';

function DesglozarPorcolor({ producto, colores, coloresOptions = [], onColoresAsignadosChange, onCantidadRestanteChange, onColorCreated, onDistribucionGuardada }) {
    const [cantidadAsignada, setCantidadAsignada] = useState('');
    const [cantidadRestante, setCantidadRestante] = useState(producto.cantidad);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [colorSeleccionado, setColorSeleccionado] = useState(null);
    const [localColoresOptions, setLocalColoresOptions] = useState([]);
    
    // Estados para manejo de cantidad alternativa
    const [cantidadAlternativaAsignada, setCantidadAlternativaAsignada] = useState('');
    const [cantidadAlternativaRestante, setCantidadAlternativaRestante] = useState(producto.cantidadAlternativa || producto.cantidadalternativa || 0);
    const [mostrarCantidadAlternativa, setMostrarCantidadAlternativa] = useState(!!(producto.cantidadAlternativa || producto.cantidadalternativa));
    
    // Guardar el tipo de bulto basado en la unidad del producto para enviarlo al backend
    const tipoBulto = producto.unidad === 'm' || producto.unidad === 'kg' ? 'rollo' : 'caja';
    
    // Actualizar las opciones locales cuando cambian los colores - solo una vez al inicio
    useEffect(() => {
        if (coloresOptions && coloresOptions.length > 0) {
            setLocalColoresOptions(coloresOptions);
        } else if (colores && colores.length > 0) {
            const options = colores.map(color => ({
                value: color.idcolor.toString(),
                label: color.nombre + (color.codigointerno ? ` (${color.codigointerno})` : ''),
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
        if (!nuevoColor || !nuevoColor.idcolor) {
            console.error('El color recibido no tiene el formato correcto:', nuevoColor);
            return;
        }
        const colorNormalizado = {
            idcolor: nuevoColor.idcolor || nuevoColor.idColor,
            nombre: nuevoColor.nombre,
            codigointerno: nuevoColor.codigointerno || nuevoColor.codigoInterno
        };
        const newOption = {
            value: colorNormalizado.idcolor.toString(),
            label: colorNormalizado.nombre + (colorNormalizado.codigointerno ? ` (${colorNormalizado.codigointerno})` : ''),
            data: colorNormalizado
        };
        setLocalColoresOptions(prev => {
            const colorExists = prev.some(opt => opt.value === newOption.value);
            if (colorExists) return prev;
            return [...prev, newOption];
        });
        setColorSeleccionado(newOption);
        console.log('Opciones locales de color tras crear:', [...localColoresOptions, newOption]);
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
            // Normalizar ids para compatibilidad
            const idProducto = producto.idproducto || producto.idProducto;
            const idContenedor = producto.idcontenedor || producto.idContenedor;
            const idContenedorProducto = producto.idcontenedorproducto || producto.idContenedorProducto;
            if (!idContenedorProducto) {
                alert("Error: No se encontró el ID del producto principal para actualizar.");
                return;
            }
            // Crear la estructura de datos para enviar al servidor
            const dataToSend = {
                producto: Number(idProducto),
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                contenedor: Number(idContenedor),
                precioPorUnidad: producto.precioPorUnidad,
                coloresAsignados: coloresAsignados.map(item => ({
                    color: Number(item.color),
                    cantidad: item.cantidad,
                    cantidadAlternativa: item.cantidadAlternativa || null,
                    rollos: [{ cantidad: item.cantidad, numero: 1 }]
                })),
                cantidadAlternativa: producto.cantidadAlternativa || producto.cantidadalternativa,
                unidadAlternativa: producto.unidadalternativa || producto.unidadAlternativa,
                item_proveedor: producto.item_proveedor,
                codigoInterno: producto.codigointerno || producto.codigoInterno,
                tipoBulto: tipoBulto,
                dataAnterior: {
                    idcontenedorproducto: idContenedorProducto,
                    nombre: producto.nombre,
                    codigoInterno: producto.codigointerno || producto.codigoInterno || '',
                    cantidad: producto.cantidad || 0,
                    unidad: producto.unidad || '',
                    color: producto.idcolor || producto.idColor || null
                },
                usuarioCambio: localStorage.getItem('userId') || 1,
                motivo: 'Distribución de colores'
            };
            console.log("ID del producto principal a actualizar:", idContenedorProducto);
            console.log("Payload enviado al backend:", dataToSend);
            // Enviar solicitud al servidor para actualizar el producto
            const response = await axios.put(`http://192.168.0.131:5000/api/contenedorProducto/${idContenedorProducto}`, dataToSend);
            alert("Distribución por colores guardada correctamente.");
            if (typeof onDistribucionGuardada === 'function') {
                onDistribucionGuardada(response.data);
            }
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
                {(producto.cantidadAlternativa || producto.cantidadalternativa) > 0 && (
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
                                Asignar también cantidad alternativa ({(producto.unidadalternativa || producto.unidadAlternativa)})
                            </label>
                        </div>
                        
                        {mostrarCantidadAlternativa && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Cantidad alternativa a asignar ({(producto.unidadalternativa || producto.unidadAlternativa)}):
                                </label>
                                <input
                                    style={{ padding: '5px', width: '100%', marginBottom: '10px' }}
                                    type="number"
                                    placeholder={`Cantidad en ${(producto.unidadalternativa || producto.unidadAlternativa)}`}
                                    min="0.01"
                                    max={cantidadAlternativaRestante}
                                    step="0.01"
                                    value={cantidadAlternativaAsignada}
                                    onChange={(e) => setCantidadAlternativaAsignada(e.target.value)}
                                />
                                <div style={{ marginBottom: '10px', color: '#666' }}>
                                    Disponible: {cantidadAlternativaRestante} {(producto.unidadalternativa || producto.unidadAlternativa)}
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
                        const colorObj = localColoresOptions.find(opt => parseInt(opt.value) === item.color);
                        const colorLabel = colorObj ? colorObj.label : `ID: ${item.color}`;
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
                                        {colorLabel}
                                    </span>
                                    <div>
                                    <span>Cantidad: {item.cantidad} {producto.unidad}</span>
                                    {(item.cantidadAlternativa || item.cantidadalternativa) && (
                                        <span style={{ marginLeft: '10px', color: '#666' }}>
                                            ({(item.cantidadAlternativa || item.cantidadalternativa)} {(producto.unidadalternativa || producto.unidadAlternativa)})
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
