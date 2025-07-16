import axios from "axios";
import { useEffect, useState } from "react";
import "../styles/AgregarProducto.css";
import CreatableSelect from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';

function agregarProducto({ setAgregarProducto, contenedor, actualizarLista }) {
    const [productosOptions, setProductosOptions] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState('');
    const [precioPorUnidad, setPrecioPorUnidad] = useState('');
    const [unidad, setUnidad] = useState('');
    const [cantidadAlternativa, setCantidadAlternativa] = useState('');
    const [unidadAlternativa, setUnidadAlternativa] = useState('');
    const [unidadDeshabilitada, setUnidadDeshabilitada] = useState(false);
    const [itemProveedor, setItemProveedor] = useState('');
    const [codigoInterno, setCodigoInterno] = useState('');
    
    // Estados para el modal de selección de unidad
    const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);
    const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
    const [nuevoProductoUnidad, setNuevoProductoUnidad] = useState('m');
    const [nuevoProductoCodigo, setNuevoProductoCodigo] = useState('');

    useEffect(() => {
        axios.get('http://gestion.lichy.local:5000/api/items/producto').then((response) => {
            // Formatear los productos para react-select
            const formattedProducts = response.data.map((item) => ({
                value: item.idProducto.toString(),
                label: item.nombre,
                unidadPredeterminada: item.unidadPredeterminada,
                tipoBultoPredeterminado: item.tipoBultoPredeterminado || 'rollos',
                codigoInterno: item.codigoInterno
            }));
            setProductosOptions(formattedProducts);
        });
    }, []);

    // Manejar la selección de un producto existente o crear uno nuevo
    const handleProductoChange = (selectedOption) => {
        setProductoSeleccionado(selectedOption);
        
        if (selectedOption && !selectedOption.value.startsWith('temp-')) {
            // Si es un producto existente, establecer unidad predeterminada
            setUnidad(selectedOption.unidadPredeterminada);
            setUnidadDeshabilitada(true);
            
            // Si el producto tiene código interno, establecerlo
            if (selectedOption.codigoInterno) {
                setCodigoInterno(selectedOption.codigoInterno);
            } else {
                setCodigoInterno('');
            }
            
            // Establecer la unidad alternativa según la unidad principal
            if (selectedOption.unidadPredeterminada === 'm' || selectedOption.unidadPredeterminada === 'kg') {
                setUnidadAlternativa('rollos');
            } else if (selectedOption.unidadPredeterminada === 'uni') {
                setUnidadAlternativa('cajas');
            } else {
                setUnidadAlternativa('');
            }
        } else {
            // Si es un producto nuevo o no seleccionado, resetear campos
            setUnidadDeshabilitada(false);
            setCodigoInterno('');
        }
    };
    
    // Inicia el proceso de creación de un producto guardando el nombre y mostrando el modal
    const handleCreateProducto = (inputValue) => {
        setNuevoProductoNombre(inputValue);
        setMostrarModalUnidad(true);
        return false; // Evitamos que react-select intente crear una opción directamente
    };
    
    // Confirma la creación del producto con la unidad seleccionada y código interno
    const confirmarCreacionProducto = async () => {
        const inputValue = nuevoProductoNombre;
        const unidadValue = nuevoProductoUnidad;
        const codigoValue = nuevoProductoCodigo;
        
        if (!codigoValue.trim()) {
            alert('El código interno es obligatorio');
            return;
        }
        
        // Establecer tipo de bulto según unidad
        const tipoBulto = (unidadValue === 'm' || unidadValue === 'kg') ? 'rollos' : 'cajas';
        
        try {
            // Crear el producto en la base de datos
            const response = await axios.post('http://gestion.lichy.local:5000/api/items/producto', {
                nombre: inputValue,
                unidadPredeterminada: unidadValue,
                tipoBultoPredeterminado: tipoBulto,
                codigoInterno: codigoValue
            });
            
            if (response.status === 200 && response.data.length > 0) {
                const nuevoProducto = {
                    value: response.data[0].idProducto.toString(),
                    label: response.data[0].nombre,
                    unidadPredeterminada: response.data[0].unidadPredeterminada,
                    tipoBultoPredeterminado: tipoBulto,
                    codigoInterno: codigoValue
                };
                
                // Actualizar la lista de productos
                setProductosOptions(prev => [...prev, nuevoProducto]);
                
                // Establecer valores
                setUnidad(nuevoProducto.unidadPredeterminada);
                setUnidadDeshabilitada(true);
                setCodigoInterno(codigoValue);
                
                // Establecer la unidad alternativa según la unidad principal
                if (nuevoProducto.unidadPredeterminada === 'm' || nuevoProducto.unidadPredeterminada === 'kg') {
                    setUnidadAlternativa('rollos');
                } else if (nuevoProducto.unidadPredeterminada === 'uni') {
                    setUnidadAlternativa('cajas');
                }
                
                // Establecer el producto seleccionado
                setProductoSeleccionado(nuevoProducto);
                
                // Ocultar el modal
                setMostrarModalUnidad(false);
                setNuevoProductoNombre('');
                setNuevoProductoCodigo('');
            }
        } catch (error) {
            console.error('Error al crear el producto:', error);
            alert('No se pudo crear el producto. Inténtalo de nuevo.');
            
            // Si falla la creación, agregar temporalmente
            const newOption = { 
                value: `temp-${uuidv4()}`, 
                label: inputValue,
                unidadPredeterminada: unidadValue,
                tipoBultoPredeterminado: tipoBulto,
                codigoInterno: codigoValue
            };
            
            setProductosOptions(prev => [...prev, newOption]);
            setUnidad(unidadValue);
            setProductoSeleccionado(newOption);
            setCodigoInterno(codigoValue);
            
            // Establecer la unidad alternativa según la unidad principal
            if (unidadValue === 'm' || unidadValue === 'kg') {
                setUnidadAlternativa('rollos');
            } else if (unidadValue === 'uni') {
                setUnidadAlternativa('cajas');
            }
            
            // Ocultar el modal
            setMostrarModalUnidad(false);
            setNuevoProductoNombre('');
            setNuevoProductoCodigo('');
        }
    };
    
    // Cancelar la creación del producto
    const cancelarCreacionProducto = () => {
        setMostrarModalUnidad(false);
        setNuevoProductoNombre('');
        setNuevoProductoCodigo('');
    };

    // Actualiza automáticamente la unidad alternativa cuando cambia la unidad principal
    const handleUnidadChange = (e) => {
        const nuevaUnidad = e.target.value;
        setUnidad(nuevaUnidad);

        // Aplicar la regla de validación: m/kg -> rollos, uni -> cajas
        if (nuevaUnidad === 'm' || nuevaUnidad === 'kg') {
            setUnidadAlternativa('rollos');
        } else if (nuevaUnidad === 'uni') {
            setUnidadAlternativa('cajas');
        } else {
            setUnidadAlternativa('');
        }
    };

    const onSubmit = async () => {
        if (!productoSeleccionado || !cantidad || !precioPorUnidad || !unidad || !codigoInterno) {
            alert('Por favor complete todos los campos obligatorios (incluido el código interno)');
            return;
        }
        
        const datos = {
            contenedor: contenedor,
            producto: productoSeleccionado.value.startsWith('temp-') ? null : productoSeleccionado.value,
            nombre: productoSeleccionado.value.startsWith('temp-') ? productoSeleccionado.label : null,
            cantidad: cantidad,
            precioPorUnidad: precioPorUnidad,
            unidad: unidad,
            cantidadAlternativa: cantidadAlternativa,
            unidadAlternativa: unidadAlternativa,
            item_proveedor: itemProveedor,
            codigoInterno: codigoInterno,
            tipoBulto: productoSeleccionado.tipoBultoPredeterminado || ((unidad === 'm' || unidad === 'kg') ? 'rollos' : 'cajas'),
            cantidadBulto: 1
        };
        
        try {
            const response = await axios.post('http://gestion.lichy.local:5000/api/contenedorProducto', datos);
            if (response.status === 200) {
                alert('Producto agregado correctamente');
                
                // Guardar el producto seleccionado actual para reutilizarlo
                const productoActual = {...productoSeleccionado};
                
                // Limpiar los campos del formulario
                setCantidad('');
                setPrecioPorUnidad('');
                setCantidadAlternativa('');
                setItemProveedor('');
                setCodigoInterno('');
                
                // Re-aplicar el mismo producto seleccionado después de un breve retraso
                // para asegurar que la actualización de estados se complete correctamente
                setTimeout(() => {
                    setProductoSeleccionado(productoActual);
                }, 50);
                
                // Actualizar lista de productos del contenedor
                actualizarLista(response.data);
            }
        } catch (error) {
            console.error('Error al agregar el producto:', error);
            alert('Hubo un error al agregar el producto.');
        }
    };

    return (
        <div className="agregar-producto-container">
            {/* Modal para seleccionar unidad al crear nuevo producto */}
            {mostrarModalUnidad && (
                <div className="modal-unidad">
                    <div className="modal-unidad-content">
                        <h3>Configura el producto "{nuevoProductoNombre}"</h3>
                        <div className="form-group">
                            <label>Código Interno: <span style={{ color: 'red' }}>*</span></label>
                            <input 
                                type="text" 
                                value={nuevoProductoCodigo} 
                                onChange={(e) => setNuevoProductoCodigo(e.target.value)}
                                placeholder="Ingrese el código interno"
                                required
                            />
                            <p className="form-help-text">
                                El código interno es obligatorio y debe ser único para cada producto.
                            </p>
                        </div>
                        <div className="form-group">
                            <label>Unidad Predeterminada: <span style={{ color: 'red' }}>*</span></label>
                            <select 
                                value={nuevoProductoUnidad} 
                                onChange={(e) => setNuevoProductoUnidad(e.target.value)}
                            >
                                <option value="m">m</option>
                                <option value="kg">kg</option>
                                <option value="uni">uni</option>
                            </select>
                            <p className="form-help-text">
                                {nuevoProductoUnidad === 'm' || nuevoProductoUnidad === 'kg' ? 
                                    'Se usará automáticamente rollos como tipo de bulto' : 
                                    'Se usará automáticamente cajas como tipo de bulto'}
                            </p>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={cancelarCreacionProducto} type="button">Cancelar</button>
                            <button 
                                onClick={confirmarCreacionProducto} 
                                type="button" 
                                className="btn-crear-producto"
                                disabled={!nuevoProductoCodigo.trim()}
                            >
                                Crear Producto
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="form-container">
                <label>Producto: <span style={{ color: 'red' }}>*</span></label>
                <CreatableSelect
                    isClearable
                    onChange={handleProductoChange}
                    onCreateOption={handleCreateProducto}
                    options={productosOptions}
                    value={productoSeleccionado}
                    placeholder="Buscar o crear producto..."
                    formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
                    className="producto-select"
                />
                
                <label>Código Interno: <span style={{ color: 'red' }}>*</span></label>
                <input 
                    type="text" 
                    value={codigoInterno} 
                    onChange={(e) => setCodigoInterno(e.target.value)}
                    placeholder="Ingrese el código interno"
                    required
                />
                
                <label>Cantidad: <span style={{ color: 'red' }}>*</span></label>
                <input 
                    type="number" 
                    name='cantidad' 
                    value={cantidad} 
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ingrese cantidad"
                    required
                />
                
                <label>Precio por unidad: <span style={{ color: 'red' }}>*</span></label>
                <input 
                    type="number" 
                    name='precioPorUnidad' 
                    value={precioPorUnidad} 
                    onChange={(e) => setPrecioPorUnidad(e.target.value)}
                    placeholder="Ingrese precio por unidad"
                    required
                />
                
                <label>Unidad: <span style={{ color: 'red' }}>*</span></label>
                <select 
                    name='unidad' 
                    value={unidad} 
                    onChange={handleUnidadChange}
                    disabled={unidadDeshabilitada}
                    required
                >
                    <option value='' disabled>Seleccionar unidad</option>
                    <option value='m'>m</option>
                    <option value='kg'>kg</option>
                    <option value='uni'>uni</option>
                </select>
                
                <label>Item Proveedor:</label>
                <input 
                    type="text" 
                    name='item_proveedor' 
                    value={itemProveedor} 
                    onChange={(e) => setItemProveedor(e.target.value)}
                    placeholder="Código o referencia del proveedor (opcional)"
                />
                
                <div style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                    <h4>Medición Alternativa</h4>
                    <label>Cantidad Alternativa:</label>
                    <input
                        type="number"
                        name='cantidadAlternativa'
                        value={cantidadAlternativa}
                        onChange={(e) => setCantidadAlternativa(e.target.value)}
                        placeholder="Cantidad en rollos/cajas"
                    />
                    
                    <label>Unidad Alternativa:</label>
                    <select
                        name='unidadAlternativa'
                        value={unidadAlternativa}
                        disabled={true} // Siempre deshabilitado, se selecciona automáticamente
                    >
                        <option value='' disabled>Seleccionar unidad alternativa</option>
                        <option value='rollos'>Rollos</option>
                        <option value='cajas'>Cajas</option>
                    </select>
                    <p style={{ fontSize: '0.8em', color: '#666' }}>
                        {unidad === 'm' || unidad === 'kg' ? 'Para productos medidos en m o kg, se usa automáticamente rollos' :
                            unidad === 'uni' ? 'Para productos medidos en unidades, se usa automáticamente cajas' :
                                'Seleccione una unidad principal primero'}
                    </p>
                </div>
                
                <div className="botones-container">
                    <button type="button" onClick={() => setAgregarProducto(false)}>Cancelar</button>
                    <button type="button" onClick={onSubmit}>Agregar Producto</button>
                </div>
            </div>
        </div>
    );
}

export default agregarProducto;
