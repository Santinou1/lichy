import axios from "axios";
import { useEffect, useState } from "react";
import "../styles/AgregarProducto.css";
import CreatableSelect from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';

function agregarProducto({ setAgregarProducto, contenedor, actualizarLista }) {
    const [productosOptions, setProductosOptions] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState('');
    const [precioporunidad, setPrecioporunidad] = useState('');
    const [unidad, setUnidad] = useState('');
    const [cantidadalternativa, setCantidadalternativa] = useState('');
    const [unidadalternativa, setUnidadalternativa] = useState('');
    const [unidadDeshabilitada, setUnidadDeshabilitada] = useState(false);
    const [item_proveedor, setItem_proveedor] = useState('');
    
    // Estados para el modal de selección de unidad
    const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);
    const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
    const [nuevoProductoUnidad, setNuevoProductoUnidad] = useState('m');

    useEffect(() => {
        axios.get('http://192.168.0.131:5000/api/items/producto').then((response) => {
            // Formatear los productos para react-select
            const formattedProducts = response.data.map((item) => ({
                value: item.idproducto.toString(),
                label: item.nombre,
                unidadPredeterminada: item.unidadpredeterminada,
                tipoBultoPredeterminado: item.tipobultopredeterminado || 'rollos',
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
            
            // Establecer la unidad alternativa según la unidad principal
            if (selectedOption.unidadPredeterminada === 'm' || selectedOption.unidadPredeterminada === 'kg') {
                setUnidadalternativa('rollos');
            } else if (selectedOption.unidadPredeterminada === 'uni') {
                setUnidadalternativa('cajas');
            } else {
                setUnidadalternativa('');
            }
        } else {
            // Si es un producto nuevo o no seleccionado, resetear campos
            setUnidadDeshabilitada(false);
        }
    };
    
    // Inicia el proceso de creación de un producto guardando el nombre y mostrando el modal
    const handleCreateProducto = (inputValue) => {
        setNuevoProductoNombre(inputValue);
        setMostrarModalUnidad(true);
        return false; // Evitamos que react-select intente crear una opción directamente
    };
    
    // Confirma la creación del producto con la unidad seleccionada
    const confirmarCreacionProducto = async () => {
        const inputValue = nuevoProductoNombre;
        const unidadValue = nuevoProductoUnidad;
        
        // Establecer tipo de bulto según unidad
        const tipoBulto = (unidadValue === 'm' || unidadValue === 'kg') ? 'rollos' : 'cajas';
        
        try {
            // Crear el producto en la base de datos
            const response = await axios.post('http://192.168.0.131:5000/api/items/producto', {
                nombre: inputValue,
                unidadPredeterminada: unidadValue,
                tipoBultoPredeterminado: tipoBulto
            });
            
            if (response.status === 200 && response.data.length > 0) {
                const nuevoProducto = {
                    value: response.data[0].idproducto.toString(),
                    label: response.data[0].nombre,
                    unidadPredeterminada: response.data[0].unidadpredeterminada,
                    tipoBultoPredeterminado: tipoBulto
                };
                
                // Actualizar la lista de productos
                setProductosOptions(prev => [...prev, nuevoProducto]);
                
                // Establecer valores
                setUnidad(nuevoProducto.unidadPredeterminada);
                setUnidadDeshabilitada(true);
                
                // Establecer el producto seleccionado
                setProductoSeleccionado(nuevoProducto);
                
                // Establecer la unidad alternativa según la unidad principal
                if (nuevoProducto.unidadPredeterminada === 'm' || nuevoProducto.unidadPredeterminada === 'kg') {
                    setUnidadalternativa('rollos');
                } else if (nuevoProducto.unidadPredeterminada === 'uni') {
                    setUnidadalternativa('cajas');
                }
                
                // Ocultar el modal
                setMostrarModalUnidad(false);
                setNuevoProductoNombre('');
            }
        } catch (error) {
            console.error('Error al crear el producto:', error);
            alert('No se pudo crear el producto. Inténtalo de nuevo.');
            
            // Si falla la creación, agregar temporalmente
            const newOption = { 
                value: `temp-${uuidv4()}`, 
                label: inputValue,
                unidadPredeterminada: unidadValue,
                tipoBultoPredeterminado: tipoBulto
            };
            
            setProductosOptions(prev => [...prev, newOption]);
            setUnidad(unidadValue);
            setProductoSeleccionado(newOption);
            
            // Establecer la unidad alternativa según la unidad principal
            if (unidadValue === 'm' || unidadValue === 'kg') {
                setUnidadalternativa('rollos');
            } else if (unidadValue === 'uni') {
                setUnidadalternativa('cajas');
            }
            
            // Ocultar el modal
            setMostrarModalUnidad(false);
            setNuevoProductoNombre('');
        }
    };
    
    // Cancelar la creación del producto
    const cancelarCreacionProducto = () => {
        setMostrarModalUnidad(false);
        setNuevoProductoNombre('');
    };

    // Actualiza automáticamente la unidad alternativa cuando cambia la unidad principal
    const handleUnidadChange = (e) => {
        const nuevaUnidad = e.target.value;
        setUnidad(nuevaUnidad);

        // Aplicar la regla de validación: m/kg -> rollos, uni -> cajas
        if (nuevaUnidad === 'm' || nuevaUnidad === 'kg') {
            setUnidadalternativa('rollos');
        } else if (nuevaUnidad === 'uni') {
            setUnidadalternativa('cajas');
        } else {
            setUnidadalternativa('');
        }
    };

    const onSubmit = async () => {
        if (!productoSeleccionado || !cantidad || !precioporunidad || !unidad) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }
        
        const datos = {
            contenedor: contenedor,
            producto: productoSeleccionado.value.startsWith('temp-') ? null : productoSeleccionado.value,
            nombre: productoSeleccionado.value.startsWith('temp-') ? productoSeleccionado.label : null,
            cantidad: cantidad,
            precioporunidad: precioporunidad,
            unidad: unidad,
            cantidadalternativa: cantidadalternativa,
            unidadalternativa: unidadalternativa,
            item_proveedor: item_proveedor,
            tipobulto: productoSeleccionado.tipoBultoPredeterminado || ((unidad === 'm' || unidad === 'kg') ? 'rollos' : 'cajas'),
            cantidadbulto: 1
        };
        
        try {
            const response = await axios.post('http://192.168.0.131:5000/api/contenedorProducto', datos);
            if (response.status === 200) {
                alert('Producto agregado correctamente');
                
                // Guardar el producto seleccionado actual para reutilizarlo
                const productoActual = {...productoSeleccionado};
                
                // Limpiar los campos del formulario
                setCantidad('');
                setPrecioporunidad('');
                setCantidadalternativa('');
                setItem_proveedor('');
                
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
                    name='precioporunidad' 
                    value={precioporunidad} 
                    onChange={(e) => setPrecioporunidad(e.target.value)}
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
                    value={item_proveedor} 
                    onChange={(e) => setItem_proveedor(e.target.value)}
                    placeholder="Código o referencia del proveedor (opcional)"
                />
                
                <div style={{ marginTop: '15px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                    <h4>Medición Alternativa</h4>
                    <label>Cantidad Alternativa:</label>
                    <input
                        type="number"
                        name='cantidadalternativa'
                        value={cantidadalternativa}
                        onChange={(e) => setCantidadalternativa(e.target.value)}
                        placeholder="Cantidad en rollos/cajas"
                    />
                    
                    <label>Unidad Alternativa:</label>
                    <select
                        name='unidadalternativa'
                        value={unidadalternativa}
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
