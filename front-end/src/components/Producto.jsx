import { useEffect, useState } from 'react';
import '../styles/Producto.css';
import '../styles/ProductoEstados.css'; // Estilos adicionales para estados
import '../styles/ProductoInlineEdit.css'; // Estilos para edición en línea
import axios from 'axios';
import DesglozarPorcolor from './DesglozarPorColor';
import ConfirmarEliminar from './ConfirmarEliminar';
import CambiarEstadoProducto from './CambiarEstadoProducto';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

function Producto({ user, producto, onActualizar, contenedor, modoEdicionLotes, registrarCambioProducto }) {
    const nav = useNavigate();
    const [mostrarForm, setMostrarForm] = useState(false);
    const [mostrarCambioEstado, setMostrarCambioEstado] = useState(false);
    const [colores, setColores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productoActualizado, setProductoActualizado] = useState(producto);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [cantidadRestante, setCantidadRestante] = useState(producto.cantidad);
    
    // Estados para edición en línea
    const [editando, setEditando] = useState(false);
    const [editForm, setEditForm] = useState({
        codigoInterno: producto.codigoInterno || '',
        color: producto.idColor || '',
        colorNombre: producto.color || '', // Usamos producto.color en lugar de producto.nombreColor
        colorNuevo: null,
        cantidad: producto.cantidad || 0
    });
    
    // Estado local para el modo de edición por lotes
    const [loteForm, setLoteForm] = useState({
        codigoInterno: producto.codigoInterno || '',
        color: producto.idColor || '',
        colorNombre: producto.color || '', // Usamos producto.color en lugar de producto.nombreColor
        cantidad: producto.cantidad || 0,
        // Añadimos una bandera para saber si el color ha sido modificado
        colorModificado: false
    });
    
    // Estado para manejar la creación de un nuevo color
    const [creandoColor, setCreandoColor] = useState(false);
    const [nuevoColor, setNuevoColor] = useState({
        nombre: '',
        codigoInterno: ''
    });
    
    // Función para mostrar/ocultar el formulario completo
    const cambiarNumero = () => {
        setMostrarForm(!mostrarForm);
        // Si estamos abriendo el formulario de edición, ocultamos el de cambio de estado
        if (!mostrarForm) {
            setMostrarCambioEstado(false);
            setEditando(false);
        }
    }
    
    // Función para iniciar la edición en línea
    const iniciarEdicion = () => {
        // Si estamos en modo edición por lotes, no hacemos nada
        if (modoEdicionLotes) return;
        
        setEditando(true);
        setMostrarCambioEstado(false);
        setMostrarForm(false);
        // Inicializar el formulario con los valores actuales
        setEditForm({
            codigoInterno: productoActualizado.codigoInterno || '',
            color: productoActualizado.idColor || '',
            colorNombre: productoActualizado.color || '', // Usamos productoActualizado.color en lugar de productoActualizado.nombreColor
            colorNuevo: null,
            cantidad: productoActualizado.cantidad || 0
        });
    }
    
    // Función para manejar la creación de un nuevo color
    const handleCreateColor = async (inputValue) => {
        console.log('Creando nuevo color:', inputValue);
        // Mostrar modal para ingresar código interno del color
        setCreandoColor(true);
        setNuevoColor({
            nombre: inputValue,
            codigoInterno: ''
        });
    }
    
    // Función para guardar un nuevo color en la base de datos
    const guardarNuevoColor = async () => {
        try {
            console.log('Guardando nuevo color:', nuevoColor);
            
            // Validar que se ingresó un código interno
            if (!nuevoColor.codigoInterno) {
                alert('Debe ingresar un código interno para el color');
                return;
            }
            
            // Enviar petición para crear el color
            const response = await axios.post('http://localhost:5000/api/items/color', {
                nombre: nuevoColor.nombre,
                codigoInterno: nuevoColor.codigoInterno
            });
            
            console.log('Respuesta del servidor:', response.data);
            
            // Actualizar la lista de colores
            const nuevoColorCreado = response.data;
            setColores(prevColores => [...prevColores, nuevoColorCreado]);
            
            // Actualizar el formulario con el nuevo color
            setEditForm({
                ...editForm,
                color: nuevoColorCreado.idColor,
                colorNombre: nuevoColorCreado.nombre // Guardamos solo el nombre para la base de datos
            });
            
            // Cerrar el modal
            setCreandoColor(false);
            
            alert(`Color "${nuevoColorCreado.nombre}" creado exitosamente`);
            
        } catch (error) {
            console.error('Error al crear el color:', error);
            console.error('Detalles del error:', error.response ? error.response.data : 'No hay detalles adicionales');
            alert('Hubo un error al crear el color. Por favor, inténtelo de nuevo.');
        }
    }
    
    // Función para cancelar la creación de un nuevo color
    const cancelarCreacionColor = () => {
        setCreandoColor(false);
        setNuevoColor({
            nombre: '',
            codigoInterno: ''
        });
    }
    
    // Función para cancelar la edición en línea
    const cancelarEdicion = () => {
        setEditando(false);
    }
    
    // Función para mostrar/ocultar el formulario de cambio de estado
    const toggleCambioEstado = () => {
        setMostrarCambioEstado(!mostrarCambioEstado);
        // Si estamos abriendo el formulario de cambio de estado, ocultamos el de edición
        if (!mostrarCambioEstado) {
            setMostrarForm(false);
            setEditando(false);
        }
    }
    
    // Función que maneja cuando un estado ha sido cambiado
    const handleEstadoCambiado = (productoConNuevoEstado) => {
        // Actualizamos el producto con los nuevos valores
        setProductoActualizado(productoConNuevoEstado);

        // Si hay una función para actualizar la lista principal, la llamamos
        if (onActualizar) {
            axios.get(`http://localhost:5000/api/contenedorProducto/${contenedor}`)
                .then(response => {
                    onActualizar(response.data);
                })
                .catch(error => {
                    console.error('Error actualizando lista de productos:', error);
                });
        }

        // Ocultamos el formulario de cambio de estado
        setMostrarCambioEstado(false);
    }
    
    const refirigir = () => {
        nav(`/actualizar-producto-contenedor/${producto.idContenedorProductos}`);
    }
    
    const handleColoresAsignadosChange = (nuevosColoresAsignados) => {
        setColoresAsignados(nuevosColoresAsignados);
        setProductoActualizado(prevState => ({
            ...prevState,
            idColor: nuevosColoresAsignados.length > 0 ? nuevosColoresAsignados[0].idColor : null
        }));
    };
    
    const handleCantidadRestanteChange = (nuevaCantidadRestante) => {
        setCantidadRestante(nuevaCantidadRestante);
    };
    
    const onSubmit = async (e) => {
        if (e) e.preventDefault();

        const datosActualizados = {
            producto: productoActualizado.idProducto, // ID del producto
            cantidad: cantidadRestante === 0 ? cantidadRestante : productoActualizado.cantidad,
            unidad: productoActualizado.unidad,
            color: productoActualizado.idColor,
            precioPorUnidad: productoActualizado.precioPorUnidad,
            cantidadAlternativa: productoActualizado.cantidadAlternativa,
            unidadAlternativa: productoActualizado.unidadAlternativa,
            coloresAsignados: coloresAsignados,
            contenedor: contenedor,
            codigoInterno: productoActualizado.codigoInterno, // Añadido para permitir actualizar el código interno
        };

        console.log('Datos a enviar al backend:');
        console.log('Código interno:', productoActualizado.codigoInterno);
        console.log('Datos completos:', datosActualizados);
        console.log('coloresAsignados:', coloresAsignados)

        try {
            const response = await axios.put(`http://localhost:5000/api/contenedorProducto/${producto.idContenedorProductos}`, datosActualizados);
            console.log('Respuesta del backend:', response.data);
            
            // Si hay una función para actualizar la lista principal, la llamamos
            if (onActualizar) {
                const response = await axios.get(`http://localhost:5000/api/contenedorProducto/${contenedor}`);
                onActualizar(response.data);
            }
            
            // Ocultamos el formulario de edición
            setMostrarForm(false);
        } catch (error) {
            console.error('Error actualizando producto:', error);
            alert('Error actualizando producto. Por favor, intente de nuevo.');
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Verificar si es un campo numérico y convertir a número si es necesario
        let processedValue = value;
        if (['cantidad', 'precioPorUnidad', 'cantidadAlternativa', 'cantidadBulto', 'codigoInterno'].includes(name)) {
            // Si es un campo numérico y el valor no está vacío, convertir a número
            processedValue = value === '' ? '' : Number(value);
        }
        
        // Si es unidadAlternativa, establecer automáticamente según la unidad principal
        if (name === 'unidad') {
            let unidadAlt = '';
            if (value === 'm' || value === 'kg') {
                unidadAlt = 'rollos';
            } else if (value === 'uni') {
                unidadAlt = 'cajas';
            }
            
            setProductoActualizado(prevState => ({
                ...prevState,
                [name]: value,
                unidadAlternativa: unidadAlt
            }));
        } else {
            setProductoActualizado(prevState => ({
                ...prevState,
                [name]: processedValue
            }));
        }
    };
    
    // Manejar cambios en el formulario de edición en línea
    const handleColorChange = (newValue, actionMeta) => {
        console.log('Color change:', newValue, actionMeta);
        
        // La creación de nuevos colores ahora se maneja con onCreateOption
        // Aquí solo manejamos la selección de colores existentes
        if (newValue) {
            // Extraer el nombre del color sin el código para guardarlo en la base de datos
            const colorData = newValue.data || colores.find(c => c.idColor === newValue.value);
            const nombreColor = colorData ? colorData.nombre : newValue.label.split(' (')[0];
            
            // Si estamos en modo edición por lotes, actualizamos el estado local y registramos el cambio
            if (modoEdicionLotes && registrarCambioProducto) {
                // Actualizar el estado local para que el usuario vea lo que ha seleccionado
                setLoteForm(prevState => ({
                    ...prevState,
                    color: newValue.value,
                    colorNombre: nombreColor,
                    colorModificado: true // Marcamos que el color ha sido modificado
                }));
                
                // Registrar el cambio para guardarlo posteriormente
                registrarCambioProducto(producto.idContenedorProductos, {
                    color: newValue.value,
                    producto: producto.idProducto,
                    cantidad: producto.cantidad,
                    unidad: producto.unidad,
                    precioPorUnidad: producto.precioPorUnidad,
                    cantidadAlternativa: producto.cantidadAlternativa,
                    unidadAlternativa: producto.unidadAlternativa
                });
                return;
            }
            
            // Modo edición normal
            setEditForm(prevState => ({
                ...prevState,
                color: newValue.value,
                colorNombre: nombreColor // Guardamos solo el nombre sin el código
            }));
        } else {
            if (modoEdicionLotes && registrarCambioProducto) {
                // Actualizar el estado local
                setLoteForm(prevState => ({
                    ...prevState,
                    color: '',
                    colorNombre: '',
                    colorModificado: true // Marcamos que el color ha sido modificado
                }));
                
                // Registrar el cambio
                registrarCambioProducto(producto.idContenedorProductos, {
                    color: null,
                    producto: producto.idProducto,
                    cantidad: producto.cantidad,
                    unidad: producto.unidad,
                    precioPorUnidad: producto.precioPorUnidad,
                    cantidadAlternativa: producto.cantidadAlternativa,
                    unidadAlternativa: producto.unidadAlternativa
                });
                return;
            }
            
            setEditForm(prevState => ({
                ...prevState,
                color: '',
                colorNombre: ''
            }));
        }
    };
    
    // Manejar cambios en el formulario de edición en línea
    const handleEditFormChange = (e) => {
        // Para eventos de input normales
        const { name, value } = e.target;
        let processedValue = value;
        
        if (['cantidad', 'codigoInterno'].includes(name)) {
            processedValue = value === '' ? '' : Number(value);
        }
        
        // Si estamos en modo edición por lotes, actualizamos el estado local y registramos el cambio
        if (modoEdicionLotes && registrarCambioProducto) {
            // Actualizar el estado local para que el usuario vea lo que está escribiendo
            setLoteForm(prevState => ({
                ...prevState,
                [name]: processedValue
            }));
            
            // Registrar el cambio para guardarlo posteriormente
            registrarCambioProducto(producto.idContenedorProductos, {
                [name]: processedValue,
                producto: producto.idProducto,
                unidad: producto.unidad,
                precioPorUnidad: producto.precioPorUnidad,
                cantidadAlternativa: producto.cantidadAlternativa,
                unidadAlternativa: producto.unidadAlternativa
            });
            return;
        }
        
        // Modo edición normal
        setEditForm(prevState => ({
            ...prevState,
            [name]: processedValue
        }));
    };
    
    // Manejar cambios en el formulario de nuevo color
    const handleNuevoColorChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        if (name === 'codigoInterno') {
            processedValue = value === '' ? '' : Number(value);
        }
        
        setNuevoColor(prevState => ({
            ...prevState,
            [name]: processedValue
        }));
    };
    
    // Guardar los cambios de la edición en línea
    const guardarEdicionEnLinea = async () => {
        // Actualizar el estado local primero
        const nuevoProductoActualizado = {
            ...productoActualizado,
            codigoInterno: editForm.codigoInterno,
            idColor: editForm.color,
            cantidad: editForm.cantidad
        };
        
        setProductoActualizado(nuevoProductoActualizado);
        
        // Preparar datos para enviar al backend
        const datosActualizados = {
            producto: nuevoProductoActualizado.idProducto,
            cantidad: editForm.cantidad,
            unidad: nuevoProductoActualizado.unidad,
            color: editForm.color,
            precioPorUnidad: nuevoProductoActualizado.precioPorUnidad,
            cantidadAlternativa: nuevoProductoActualizado.cantidadAlternativa,
            unidadAlternativa: nuevoProductoActualizado.unidadAlternativa,
            contenedor: contenedor,
            codigoInterno: editForm.codigoInterno,
            // Incluir los datos anteriores para el historial
            dataAnterior: {
                idContenedorProductos: producto.idContenedorProductos,
                nombre: producto.nombre,
                codigoInterno: producto.codigoInterno,
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                color: producto.idColor,
                precioPorUnidad: producto.precioPorUnidad,
                cantidadAlternativa: producto.cantidadAlternativa,
                unidadAlternativa: producto.unidadAlternativa
            },
            // Incluir usuario para el historial
            usuarioCambio: user.username || 'sistema',
            motivo: 'Edición en línea'
        };
        
        console.log('Enviando datos actualizados:', datosActualizados);
        
        try {
            await axios.put(`http://localhost:5000/api/contenedorProducto/${producto.idContenedorProductos}`, datosActualizados);
            
            // Actualizar la lista de productos
            if (onActualizar) {
                const response = await axios.get(`http://localhost:5000/api/contenedorProducto/${contenedor}`);
                onActualizar(response.data);
            }
            
            // Salir del modo edición
            setEditando(false);
            
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            console.error('Detalles del error:', error.response ? error.response.data : 'No hay detalles adicionales');
            alert('Hubo un error al actualizar el producto. Por favor, inténtelo de nuevo.');
        }
    };

    // Obtener colores disponibles
    const fetchColores = async () => {
        try {
            console.log('Obteniendo colores...');
            const response = await axios.get('http://localhost:5000/api/items/color');
            console.log('Colores obtenidos:', response.data);
            setColores(response.data);
        } catch (error) {
            console.error('Error al obtener colores:', error);
        }
    };
    
    // Obtener productos disponibles
    const fetchProductos = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/items/producto');
            setProductos(response.data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
        }
    };
    
    // Cargar datos al montar el componente

// Cargar datos al montar el componente
useEffect(() => {
    fetchColores();
    fetchProductos();
}, []);

// Efecto para actualizar el estado cuando cambia el producto
useEffect(() => {
    console.log('Producto actualizado:', producto);
    console.log('Color del producto:', producto.color);
    console.log('ID del color:', producto.idColor);
    
    setProductoActualizado(producto);
    
    // Actualizar también el estado de edición por lotes cuando cambia el producto
    setLoteForm({
        codigoInterno: producto.codigoInterno || '',
        color: producto.idColor || '',
        colorNombre: producto.color || '', // Usamos producto.color en lugar de producto.nombreColor
        cantidad: producto.cantidad || 0,
        colorModificado: false // Reiniciamos la bandera cuando cambia el producto
    });
    
    console.log('Estado loteForm actualizado:', {
        codigoInterno: producto.codigoInterno || '',
        color: producto.idColor || '',
        colorNombre: producto.color || '',
        cantidad: producto.cantidad || 0
    });
}, [producto]);

// Actualizar el formulario de edición cuando cambia el producto actualizado
useEffect(() => {
    console.log('Producto actualizado en efecto:', productoActualizado);
    console.log('Color del producto actualizado:', productoActualizado.color);
    
    setEditForm({
        codigoInterno: productoActualizado.codigoInterno || '',
        color: productoActualizado.idColor || '',
        colorNombre: productoActualizado.color || '', // Usamos productoActualizado.color en lugar de productoActualizado.nombreColor
        colorNuevo: null,
        cantidad: productoActualizado.cantidad || 0
    });
}, [productoActualizado]);
    return (
        <>
            <div className='producto-container'>
                {mostrarForm ? (
                    <>
                        <form className='datos-actuales-producto' onSubmit={onSubmit}>
                            <select name='idProducto' value={productoActualizado.idProducto || ''} onChange={handleInputChange}>
                                <option value=''>Seleccionar producto</option>
                                {productos.map((prod) => (
                                    <option key={prod.idProducto} value={prod.idProducto}>
                                        {prod.nombre}
                                    </option>
                                ))}
                            </select>

                            {/* Campo para el código interno */}
                            <input
                                type='text'
                                name='codigoInterno'
                                placeholder='Código Interno'
                                value={productoActualizado.codigoInterno || ''}
                                onChange={handleInputChange}
                            />

                            {
                                // Si tiene color solo editarlo, si no tiene se puede desglozar la cantidad por colores
                                productoActualizado.idColor ? <>
                                    <select name='idColor' value={productoActualizado.idColor || ''} onChange={handleInputChange}>
                                        <option value=''>Seleccionar color</option>
                                        {colores.map((color) => (
                                            <option key={color.idColor} value={color.idColor}>
                                                {color.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </> : null
                            }

                            <input
                                type='text'
                                name='cantidad'
                                placeholder='Cantidad'
                                value={productoActualizado.cantidad || ''}
                                onChange={handleInputChange}
                            />
                            <select
                                type='text'
                                name='unidad'
                                value={productoActualizado.unidad || ''}
                                onChange={handleInputChange}
                            >
                                <option value='' disabled>Seleccionar unidad</option>
                                <option value='m'>m</option>
                                <option value='kg'>kg</option>
                                <option value='uni'>uni</option>
                            </select>
                            <input type='number' name='precioPorUnidad' placeholder='Precio por unidad' value={productoActualizado.precioPorUnidad || ''} onChange={handleInputChange} />

                            <div style={{ marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                                <h4>Medición Alternativa</h4>
                                <input
                                    type='number'
                                    name='cantidadAlternativa'
                                    placeholder='Cantidad alternativa'
                                    value={productoActualizado.cantidadAlternativa || ''}
                                    onChange={handleInputChange}
                                />
                                <select
                                    name='unidadAlternativa'
                                    value={productoActualizado.unidadAlternativa || ''}
                                    disabled={true} // Siempre deshabilitado, se selecciona automáticamente
                                >
                                    <option value='' disabled>Seleccionar unidad alternativa</option>
                                    <option value='rollos'>Rollos</option>
                                    <option value='cajas'>Cajas</option>
                                </select>
                                <p style={{ fontSize: '0.8em', color: '#666' }}>
                                    {productoActualizado.unidad === 'm' || productoActualizado.unidad === 'kg' ? 'Para productos medidos en m o kg, se usa automáticamente rollos' :
                                        productoActualizado.unidad === 'uni' ? 'Para productos medidos en unidades, se usa automáticamente cajas' :
                                            'Seleccione una unidad principal primero'}
                                </p>
                            </div>

                            <button type='submit'>Actualizar</button>
                        </form>
                        <ConfirmarEliminar id={producto.idContenedorProductos} tipo={'ContenedorProducto'} />
                    </>
                ) : editando || modoEdicionLotes ? (
                    <div className='datos-actuales-producto edicion-inline-container'>
                        <label><b>{productoActualizado.nombre}</b></label>
                        
                        <div className="campo-editable">
                            <label>Código Interno:</label>
                            <input 
                                type="number" 
                                name="codigoInterno" 
                                value={modoEdicionLotes ? loteForm.codigoInterno : editForm.codigoInterno} 
                                onChange={handleEditFormChange}
                                className="edicion-inline"
                            />
                        </div>
                        
                        <div className="campo-editable">
                            <label>Color:</label>
                            <CreatableSelect
                                className="edicion-inline-select"
                                placeholder="Selecciona o crea un color"
                                isClearable
                                options={colores.map(color => ({
                                    value: color.idColor,
                                    label: `${color.nombre} (${color.codigoInterno})`,
                                    data: color // Guardamos el objeto completo para acceder a todas sus propiedades
                                }))}
                                value={
                                    modoEdicionLotes ? 
                                    (loteForm.colorModificado ? 
                                        // Si el color ha sido modificado, usamos el valor del estado loteForm
                                        (loteForm.color ? {
                                            value: loteForm.color,
                                            label: loteForm.colorNombre ? 
                                                (loteForm.colorNombre.includes('(') ? 
                                                    loteForm.colorNombre : 
                                                    `${loteForm.colorNombre} ${colores.find(c => c.idColor === loteForm.color)?.codigoInterno ? `(${colores.find(c => c.idColor === loteForm.color)?.codigoInterno})` : ''}`) : 
                                                ''
                                        } : null) :
                                        // Si el color no ha sido modificado, usamos el valor original del producto
                                        (producto.idColor ? {
                                            value: producto.idColor,
                                            label: `${producto.color || ''} ${colores.find(c => c.idColor === producto.idColor)?.codigoInterno ? `(${colores.find(c => c.idColor === producto.idColor)?.codigoInterno})` : ''}`
                                        } : null)
                                    ) :
                                    (editForm.color ? {
                                        value: editForm.color,
                                        label: editForm.colorNombre && editForm.colorNombre.includes('(') ? 
                                               editForm.colorNombre : 
                                               `${editForm.colorNombre || ''} ${colores.find(c => c.idColor === editForm.color)?.codigoInterno ? `(${colores.find(c => c.idColor === editForm.color)?.codigoInterno})` : ''}`
                                    } : null)
                                }
                                onChange={handleColorChange}
                                formatCreateLabel={(inputValue) => `Crear nuevo color "${inputValue}"`}
                                onCreateOption={handleCreateColor}
                                filterOption={(option, inputValue) => {
                                    if (!option || !inputValue) return true;
                                    
                                    const label = option.label?.toLowerCase() || '';
                                    const input = inputValue.toLowerCase();
                                    const data = option.data || {};
                                    
                                    // Permitir búsqueda por nombre o código
                                    return label.includes(input) || 
                                           (data.codigoInterno?.toString() || '').includes(input) ||
                                           (data.nombre?.toLowerCase() || '').includes(input);
                                }}
                            />
                        </div>
                        
                        {/* Modal para crear un nuevo color */}
                        {creandoColor && (
                            <div className="color-modal-overlay">
                                <div className="color-modal">
                                    <h3>Crear nuevo color</h3>
                                    <div className="color-modal-content">
                                        <div className="form-group">
                                            <label>Nombre:</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={nuevoColor.nombre}
                                                onChange={handleNuevoColorChange}
                                                disabled
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Código Interno:</label>
                                            <input
                                                type="number"
                                                name="codigoInterno"
                                                value={nuevoColor.codigoInterno}
                                                onChange={handleNuevoColorChange}
                                                placeholder="Ingrese un código numérico"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="color-modal-actions">
                                        <button onClick={guardarNuevoColor} className="btn-guardar-color">Guardar Color</button>
                                        <button onClick={cancelarCreacionColor} className="btn-cancelar-color">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="campo-editable">
                            <label>Cantidad:</label>
                            <div className="cantidad-con-unidad">
                                <input 
                                    type="number" 
                                    name="cantidad" 
                                    value={modoEdicionLotes ? loteForm.cantidad : editForm.cantidad} 
                                    onChange={handleEditFormChange}
                                    className="edicion-inline"
                                    min="0"
                                    step="0.01"
                                />
                                <span>{productoActualizado.unidad}</span>
                            </div>
                        </div>
                        
                        {productoActualizado.cantidadAlternativa && productoActualizado.unidadAlternativa && (
                            <label>Cantidad Alt.: <b>{`${parseFloat(productoActualizado.cantidadAlternativa).toFixed(2)} ${productoActualizado.unidadAlternativa}`}</b></label>
                        )}
                        
                        <div className="precio-total">
                            ${(productoActualizado.cantidad * productoActualizado.precioPorUnidad).toFixed(2)} ({productoActualizado.cantidad} {productoActualizado.unidad} x ${productoActualizado.precioPorUnidad})
                        </div>
                        
                        <div className="estado-producto">
                            Estado: <span className={`estado-badge ${productoActualizado.estado === 'Entregado' ? 'entregado' : 'en-stock'}`}>
                                {productoActualizado.estado || 'En stock'}
                            </span>
                            {productoActualizado.nombreContenedorDestino && (
                                <span className="destino-badge"> → {productoActualizado.nombreContenedorDestino}</span>
                            )}
                        </div>
                        
                        {!modoEdicionLotes && (
                            <div className="edicion-inline-botones">
                                <button onClick={guardarEdicionEnLinea} className="btn-guardar-inline">Guardar</button>
                                <button onClick={cancelarEdicion} className="btn-cancelar-inline">Cancelar</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='datos-actuales-producto'>
                        <label style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: '5px' }}>{productoActualizado.nombre}</label>
                        <label>Código Interno: <b>{productoActualizado.codigoInterno || 'Sin código'}</b></label>
                        <label>Color: <b>{productoActualizado.color || 'Sin color'}</b></label>
                        <label>
                            Cantidad: <b>
                                {productoActualizado.cantidad ? `${parseFloat(productoActualizado.cantidad).toFixed(2)} ${productoActualizado.unidad}` : 'Sin cantidad'}
                            </b>
                        </label>
                        {productoActualizado.cantidadAlternativa && productoActualizado.unidadAlternativa && (
                            <label>Cantidad Alt.: <b>{`${parseFloat(productoActualizado.cantidadAlternativa).toFixed(2)} ${productoActualizado.unidadAlternativa}`}</b></label>
                        )}
                        <div className="estado-producto">
                            Estado: <span className={`estado-badge ${productoActualizado.estado === 'Entregado' ? 'entregado' : 'en-stock'}`}>
                                {productoActualizado.estado || 'En stock'}
                            </span>
                            {productoActualizado.nombreContenedorDestino && (
                                <span className="destino-badge"> → {productoActualizado.nombreContenedorDestino}</span>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Botones de acción */}
                <div className="producto-acciones">
                    {user.permisos["Editar-Contenedores"] && (
                        <>
                            {!productoActualizado.idColor ? (
                                // Mostrar el botón 'Disponer colores' cuando el producto no tiene color
                                <button 
                                    onClick={cambiarNumero} 
                                    className="btn-disponer-colores"
                                    style={{
                                        backgroundColor: '#4a90e2',
                                        color: 'white',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {mostrarForm ? 'Cancelar' : 'Disponer colores'}
                                </button>
                            ) : (
                                // Mostrar los botones originales cuando el producto tiene color
                                <>
                                    {!editando && !mostrarCambioEstado && (
                                        <button onClick={iniciarEdicion} className="btn-editar">Editar</button>
                                    )}
                                    {!editando && !mostrarForm && (
                                        <button onClick={toggleCambioEstado} className="btn-estado">
                                            {mostrarCambioEstado ? 'Cancelar' : 'Cambiar Estado'}
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
                
                {/* Formulario de Cambio de Estado */}
                {mostrarCambioEstado && (
                    <div className="cambio-estado-wrapper">
                        <CambiarEstadoProducto
                            producto={productoActualizado}
                            onEstadoCambiado={handleEstadoCambiado}
                            onClose={() => setMostrarCambioEstado(false)}
                        />
                    </div>
                )}
            </div>
            
            {!productoActualizado.idColor && mostrarForm && (
                <DesglozarPorcolor
                    producto={{...producto, idContenedor: contenedor}}
                    colores={colores}
                    onColoresAsignadosChange={handleColoresAsignadosChange}
                    onCantidadRestanteChange={handleCantidadRestanteChange}
                />
            )}
            
            <hr className='linea-producto'></hr>
        </>
    );
}

export default Producto;
