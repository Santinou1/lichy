import { useEffect, useState } from 'react';
import '../styles/Producto.css';
import '../styles/ProductoEstados.css'; // Estilos adicionales para estados
import '../styles/ProductoInlineEdit.css'; // Estilos para edición en línea
import axios from 'axios';
import DesglozarPorcolor from './DesglozarPorColor';
import ConfirmarEliminar from './ConfirmarEliminar';
import CambiarEstadoProducto from './CambiarEstadoProducto';
import { useNavigate } from 'react-router-dom';

function Producto({ user, producto, onActualizar, contenedor }) {
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
        cantidad: producto.cantidad || 0
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
        setEditando(true);
        setMostrarCambioEstado(false);
        setMostrarForm(false);
        // Inicializar el formulario con los valores actuales
        setEditForm({
            codigoInterno: productoActualizado.codigoInterno || '',
            color: productoActualizado.idColor || '',
            cantidad: productoActualizado.cantidad || 0
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
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        
        if (['cantidad', 'codigoInterno'].includes(name)) {
            processedValue = value === '' ? '' : Number(value);
        }
        
        setEditForm(prevState => ({
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
            codigoInterno: editForm.codigoInterno
        };
        
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
            alert('Hubo un error al actualizar el producto. Por favor, inténtelo de nuevo.');
        }
    };

    useEffect(() => {
        const fetchColores = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/color');
                setColores(response.data);
            } catch (error) {
                console.error('Error al obtener colores:', error);
            }
        };

        const fetchProductos = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/producto');
                setProductos(response.data);
            } catch (error) {
                console.error('Error al obtener productos:', error);
            }
        };

        fetchColores();
        fetchProductos();
    }, []);
    
    // Actualizar el formulario de edición cuando cambia el producto
    useEffect(() => {
        setEditForm({
            codigoInterno: productoActualizado.codigoInterno || '',
            color: productoActualizado.idColor || '',
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
                ) : editando ? (
                    <div className='datos-actuales-producto edicion-inline-container'>
                        <label><b>{productoActualizado.nombre}</b></label>
                        
                        <div className="campo-editable">
                            <label>Código Interno:</label>
                            <input 
                                type="number" 
                                name="codigoInterno" 
                                value={editForm.codigoInterno} 
                                onChange={handleEditFormChange}
                                className="edicion-inline"
                            />
                        </div>
                        
                        <div className="campo-editable">
                            <label>Color:</label>
                            <select 
                                name="color" 
                                value={editForm.color} 
                                onChange={handleEditFormChange}
                                className="edicion-inline"
                            >
                                <option value="">Sin color</option>
                                {colores.map(color => (
                                    <option key={color.idColor} value={color.idColor}>
                                        {color.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="campo-editable">
                            <label>Cantidad:</label>
                            <div className="cantidad-con-unidad">
                                <input 
                                    type="number" 
                                    name="cantidad" 
                                    value={editForm.cantidad} 
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
                        
                        <div className="edicion-inline-botones">
                            <button onClick={guardarEdicionEnLinea} className="btn-guardar-inline">Guardar</button>
                            <button onClick={cancelarEdicion} className="btn-cancelar-inline">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <div className='datos-actuales-producto'>
                        <label><b>{productoActualizado.nombre}</b></label>
                        <label>Código Interno: <b>{productoActualizado.codigoInterno || 'Sin código'}</b></label>
                        <label>Color: <b>{productoActualizado.nombreColor || 'Sin color'}</b></label>
                        <label>Cantidad: <b>{productoActualizado.cantidad ? `${parseFloat(productoActualizado.cantidad).toFixed(2)} ${productoActualizado.unidad}` : 'Sin cantidad'}</b></label>
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
                    </div>
                )}
                
                {/* Botones de acción */}
                <div className="producto-acciones">
                    {user.permisos["Editar-Contenedores"] && (
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
                    producto={producto}
                    colores={colores}
                    onColoresAsignadosChange={handleColoresAsignadosChange}
                    onCantidadRestanteChange={handleCantidadRestanteChange}
                    onDistribucionGuardada={(data) => {
                        // Actualizar el estado local con los datos actualizados
                        if (onActualizar && typeof onActualizar === 'function') {
                            // Fetch the updated product list from the server
                            axios.get(`http://localhost:5000/api/contenedorProducto/${producto.idContenedor}`)
                                .then(response => {
                                    // Update the product list in the parent component
                                    onActualizar(response.data);
                                    
                                    // Update the local product state with the new data
                                    const updatedProduct = response.data.find(p => p.idContenedorProductos === producto.idContenedorProductos);
                                    if (updatedProduct) {
                                        setProductoActualizado(updatedProduct);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error fetching updated products:', error);
                                });
                        }
                        // Ocultar el formulario de desglose
                        setMostrarForm(false);
                    }}
                />
            )}
            
            <hr className='linea-producto'></hr>
        </>
    );
}

export default Producto;
