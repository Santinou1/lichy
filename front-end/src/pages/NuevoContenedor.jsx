import '../styles/NuevoContenedor.css';
import { useForm, Controller, set } from 'react-hook-form';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserContext } from '../UserProvider.jsx';
import CreatableSelect from 'react-select/creatable';
import { v4 as uuidv4 } from 'uuid';

function NuevoContenedor() {
    const { user } = useUserContext();
    const { register, handleSubmit, control, setValue, watch } = useForm();
    const [proveedores, setProveedores] = useState([]);
    const [proveedoresOptions, setProveedoresOptions] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [redirigir, setRedirigir] = useState(false);
    const [unidadDeshabilitada, setUnidadDeshabilitada] = useState(false);
    
    // Cargar datos iniciales
    useEffect(() => {
        axios.get('http://localhost:5000/api/items/proveedor')
            .then((response) => {
                setProveedores(response.data);
                // Formatear los proveedores para react-select
                const formattedProveedores = response.data.map((item) => ({
                    value: item.idProveedor.toString(),
                    label: item.nombre
                }));
                setProveedoresOptions(formattedProveedores);
            })
            .catch((error) => {
                console.error('Error trayendo los proveedores:', error);
            });

        axios.get('http://localhost:5000/api/items/producto')
            .then((response) => {
                console.log('Productos cargados del servidor:', response.data);
                const formattedProducts = response.data.map((item) => {
                    const formattedProduct = {
                        value: item.idProducto.toString(),
                        label: item.nombre,
                        unidadPredeterminada: item.unidadPredeterminada || ''
                    };
                    console.log(`Producto formateado: ${item.nombre}, unidad: ${formattedProduct.unidadPredeterminada}`);
                    return formattedProduct;
                });
                setProductos(formattedProducts);
            })
            .catch((error) => {
                console.error('Error trayendo los productos:', error);
            });
    }, []);

    // Manejar la creación de nuevos proveedores
    const handleCreateProveedor = async (inputValue) => {
        try {
            // Crear el proveedor en la base de datos
            const response = await axios.post('http://localhost:5000/api/items/proveedor', {
                nombre: inputValue
            });
            
            if (response.status === 200 && response.data.length > 0) {
                const nuevoProveedor = {
                    value: response.data[0].idProveedor.toString(),
                    label: response.data[0].nombre
                };
                
                // Actualizar la lista de proveedores
                setProveedoresOptions((prev) => [...prev, nuevoProveedor]);
                setProveedores((prev) => [...prev, response.data[0]]);
                setValue('proveedor', nuevoProveedor);
                
                return nuevoProveedor;
            }
        } catch (error) {
            console.error('Error al crear el proveedor:', error);
            alert('No se pudo crear el proveedor. Inténtalo de nuevo.');
        }
        
        // Si falla la creación, agregar temporalmente
        const newOption = { value: `temp-${uuidv4()}`, label: inputValue };
        setProveedoresOptions((prev) => [...prev, newOption]);
        setValue('proveedor', newOption);
        return newOption;
    };

    // Manejar la creación de nuevos productos
    const handleCreateProduct = async (inputValue) => {
        // Mostrar un diálogo para seleccionar la unidad predeterminada
        const unidad = prompt("Selecciona la unidad predeterminada para el nuevo producto (m, kg, uni):");
        
        if (!unidad) {
            alert("Debes seleccionar una unidad predeterminada para crear un producto");
            return null;
        }
        
        if (!['m', 'kg', 'uni'].includes(unidad)) {
            alert("La unidad debe ser 'm', 'kg' o 'uni'");
            return null;
        }
        
        try {
            // Crear el producto en la base de datos
            const response = await axios.post('http://localhost:5000/api/items/producto', {
                nombre: inputValue,
                unidadPredeterminada: unidad
            });
            
            if (response.status === 200 && response.data.length > 0) {
                const nuevoProducto = {
                    value: response.data[0].idProducto.toString(),
                    label: response.data[0].nombre,
                    unidadPredeterminada: response.data[0].unidadPredeterminada
                };
                
                // Actualizar la lista de productos
                setProductos((prev) => [...prev, nuevoProducto]);
                setValue('producto', nuevoProducto);
                setValue('unidad', nuevoProducto.unidadPredeterminada);
                setUnidadDeshabilitada(true);
                
                return nuevoProducto;
            }
        } catch (error) {
            console.error('Error al crear el producto:', error);
            alert('No se pudo crear el producto. Inténtalo de nuevo.');
        }
        
        // Si falla la creación, agregar temporalmente
        const newOption = { value: `temp-${uuidv4()}`, label: inputValue };
        setProductos((prev) => [...prev, newOption]);
        setValue('producto', newOption);
        setUnidadDeshabilitada(false);
        return newOption;
    };
    
    // Agregar un producto a la lista
    const agregarProducto = () => {
        const productoActual = watch('producto');
        const unidadActual = watch('unidad');
        const cantidadActual = watch('cantidad');
        const cantidadAlternativaActual = watch('cantidadAlternativa');
        const precioPorUnidadActual = watch('precioPorUnidad');
        const itemProveedor = watch('item_proveedor');
        const unidadAlternativa = watch('unidadAlternativa');
        
        // Mostrar todos los datos en la consola
        console.log('==== DATOS DEL FORMULARIO ====');
        console.log('Producto seleccionado:', productoActual);
        console.log('Unidad seleccionada:', unidadActual);
        console.log('Unidad Alternativa:', unidadAlternativa);
        console.log('Cantidad:', cantidadActual);
        console.log('Cantidad Alternativa:', cantidadAlternativaActual);
        console.log('Precio por unidad (FOB):', precioPorUnidadActual);
        console.log('Item proveedor:', itemProveedor);
        console.log('Todos los datos del formulario:', watch());
        console.log('============================');
        
        if (!productoActual || !unidadActual || !cantidadActual || !precioPorUnidadActual || !unidadAlternativa || !cantidadAlternativaActual) {
            alert('Todos los campos del producto son obligatorios, incluidas las cantidades en ambas unidades');
            return;
        }

        // Valores predeterminados para los campos requeridos por el backend
        const cantidadBulto = 1;
        const tipoBulto = 'CAJA';

        const nuevoProducto = {
            idProducto: productoActual.value.startsWith('temp-') ? null : productoActual.value,
            nombre: productoActual.label,
            unidad: unidadActual,
            unidadAlternativa: unidadAlternativa,
            cantidad: cantidadActual,
            cantidadAlternativa: cantidadAlternativaActual,
            cantidadBulto: cantidadBulto,
            tipoBulto: tipoBulto,
            precioPorUnidad: precioPorUnidadActual,
            item_proveedor: itemProveedor
        };

        setProductosSeleccionados((prev) => [...prev, nuevoProducto]);

        // Limpiar los campos del producto
        setValue('producto', null);
        setValue('unidad', '');
        setValue('unidadAlternativa', '');
        setValue('cantidad', '');
        setValue('cantidadAlternativa', '');
        setValue('precioPorUnidad', '');
        setValue('item_proveedor', '');
        setUnidadDeshabilitada(false); 
    };

    const handleProductChange = (selectedOption) => {
        console.log('Producto seleccionado:', selectedOption);
        
        if (selectedOption && !selectedOption.value.startsWith('temp-')) {
            // Si el producto es existente, establecer la unidad predeterminada y deshabilitar el campo
            const productoSeleccionado = productos.find(p => p.value === selectedOption.value);
            console.log('Producto encontrado en la lista:', productoSeleccionado);
            
            if (productoSeleccionado && productoSeleccionado.unidadPredeterminada) {
                console.log(`Estableciendo unidad: ${productoSeleccionado.unidadPredeterminada}`);
                const unidad = productoSeleccionado.unidadPredeterminada;
                setValue('unidad', unidad);
                
                // Establecer automáticamente la unidad alternativa según la unidad principal
                let unidadAlternativa = '';
                if (unidad === 'm' || unidad === 'kg') {
                    unidadAlternativa = 'rollos';
                } else if (unidad === 'uni') {
                    unidadAlternativa = 'cajas';
                }
                setValue('unidadAlternativa', unidadAlternativa);
                
                setUnidadDeshabilitada(true);
            } else {
                console.log('Producto sin unidad predeterminada o no encontrado');
                setUnidadDeshabilitada(false);
            }
        } else {
            // Si el producto es nuevo, habilitar el campo de unidad
            console.log('Producto nuevo o ninguno seleccionado, habilitando campo unidad');
            setUnidadDeshabilitada(false);
        }
        setValue('producto', selectedOption);
    };
    
    const handleProveedorChange = (selectedOption) => {
        setValue('proveedor', selectedOption);
    };
    
    // Enviar el formulario
    const onSubmit = async (data) => {
        try {
            // Verificar si hay productos temporales que necesitan ser creados en la base de datos
            const productosActualizados = [...productosSeleccionados];
            
            // Procesar cada producto temporal y crear en la base de datos
            for (let i = 0; i < productosActualizados.length; i++) {
                const producto = productosActualizados[i];
                
                // Si el producto es temporal (no tiene idProducto)
                if (!producto.idProducto) {
                    try {
                        // Crear el producto en la base de datos
                        const response = await axios.post('http://localhost:5000/api/items/producto', {
                            nombre: producto.nombre,
                            unidadPredeterminada: producto.unidad
                        });
                        
                        if (response.status === 200 && response.data.length > 0) {
                            // Actualizar el ID del producto con el ID real de la base de datos
                            productosActualizados[i] = {
                                ...producto,
                                idProducto: response.data[0].idProducto
                            };
                        }
                    } catch (error) {
                        console.error('Error al crear el producto temporal:', error);
                        alert(`No se pudo crear el producto "${producto.nombre}". Verifica los datos e intenta nuevamente.`);
                        return; // Detener el envío si hay un error
                    }
                }
            }
            
            // Verificar si el proveedor es temporal y crearlo en la base de datos
            let proveedorId = data.proveedor.value;
            if (proveedorId.startsWith('temp-')) {
                try {
                    const response = await axios.post('http://localhost:5000/api/items/proveedor', {
                        nombre: data.proveedor.label
                    });
                    
                    if (response.status === 200 && response.data.length > 0) {
                        proveedorId = response.data[0].idProveedor;
                    } else {
                        alert('No se pudo crear el proveedor. Verifica los datos e intenta nuevamente.');
                        return;
                    }
                } catch (error) {
                    console.error('Error al crear el proveedor:', error);
                    alert('Error al crear el proveedor. Por favor, intenta nuevamente.');
                    return;
                }
            }
            
            const dataConUser = {
                ...data,
                proveedor: proveedorId,
                usuario: user.idUsuario,
                productos: productosActualizados,
            };
            
            await axios.post('http://localhost:5000/api/contenedores', dataConUser);
            setRedirigir(true);
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            alert('Error al enviar el formulario. Por favor, intenta nuevamente.');
        }
    };
         
    if (redirigir) {
        return <Navigate to='/redireccion' />;
    }
    return (
        <form onSubmit={handleSubmit(onSubmit)} className='nuevo-contenedor-container'>
            <h1 className='titulo'>Agregar contenedor</h1>
            <hr></hr>
            
            <div className='input-container'>
                <label htmlFor='factura'>Orden:</label>
                <input className='input-nuevoContenedor' {...register('factura')} />
            </div>
            <div className='input-container'>
                <label htmlFor='proveedor'>Proveedor:</label>
                <Controller
                    name='proveedor'
                    control={control}
                    render={({ field }) => (
                        <CreatableSelect
                            {...field}
                            options={proveedoresOptions}
                            onChange={(selectedOption) => {
                                handleProveedorChange(selectedOption);
                                field.onChange(selectedOption);
                            }}
                            onCreateOption={handleCreateProveedor}
                            isClearable
                            isSearchable
                            placeholder='Escribe o selecciona un proveedor...'
                            noOptionsMessage={() => 'No hay coincidencias, presiona Enter para agregar.'}
                            formatCreateLabel={(inputValue) => `Agregar "${inputValue}"`}
                            className='text-black'
                        />
                    )}
                />
            </div>
            <div className='input-container'>
                <label htmlFor='producto'>Producto:</label>
                <Controller
                    name='producto'
                    control={control}
                    render={({ field }) => (
                        <CreatableSelect
                            {...field}
                            options={productos}
                            onChange={(selectedOption) => {
                                // Primero actualizar el campo
                                field.onChange(selectedOption);
                                // Luego manejar los cambios adicionales
                                handleProductChange(selectedOption);
                            }}
                            onCreateOption={handleCreateProduct}
                            isClearable
                            isSearchable
                            placeholder='Escribe o selecciona...'
                            noOptionsMessage={() => 'No hay coincidencias, presiona Enter para agregar.'}
                            formatCreateLabel={(inputValue) => `Agregar "${inputValue}"`}
                            className='text-black'
                        />
                    )}
                />
            </div>
                
            <div className='input-container'>
                <div className='input-container'>
                    <label htmlFor='unidad'>Unidad:</label>
                    <input 
                        type='text' 
                        className='input-nuevoContenedor' 
                        {...register('unidad')} 
                        readOnly={true}
                        style={{ backgroundColor: '#f2f2f2' }} 
                    />
                    <span className="info-text" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>La unidad se establece automáticamente según el producto</span>
                </div>
                
                <div className='input-container'>
                    <label htmlFor='unidadAlternativa'>Unidad Alternativa:</label>
                    <input 
                        type='text' 
                        className='input-nuevoContenedor' 
                        {...register('unidadAlternativa')} 
                        readOnly={true}
                        style={{ backgroundColor: '#f2f2f2' }} 
                    />
                    <span className="info-text" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>Se establece automáticamente: 'rollos' para m/kg, 'cajas' para uni</span>
                </div>
                
                <div className='input-container'>
                    <label htmlFor='cantidad'>Cantidad <span id="unidadLabel">{watch('unidad') || ''}</span>:</label>
                    <input type='number' step="0.01" min="0.01" className='input-nuevoContenedor' {...register('cantidad')} />
                </div>
                
                <div className='input-container'>
                    <label htmlFor='cantidadAlternativa'>Cantidad <span id="unidadAltLabel">{watch('unidadAlternativa') || ''}</span>:</label>
                    <input type='number' step="0.01" min="0.01" className='input-nuevoContenedor' {...register('cantidadAlternativa')} />
                </div>
                
                <div className='input-container'>
                    <label htmlFor='fob'>FOB:</label>
                    <input type='number' step='any' className='input-nuevoContenedor' {...register('precioPorUnidad')} /> 
                </div>
                
                <div className='input-container'>
                    <label htmlFor='itemProveedor'>Item Proveedor:</label>
                    <input type='text' className='input-nuevoContenedor' {...register('item_proveedor')} /> 
                </div>
                
                <button type='button' onClick={agregarProducto}>
                    Agregar producto
                </button>
            </div>
            
            {productosSeleccionados.length > 0 && (
                <div className='productos-seleccionados'>
                    <h3>Productos agregados:</h3>
                    <ul>
                        {productosSeleccionados.map((producto, index) => (
                            <li key={index}>
                                {producto.nombre} - {producto.cantidad} {producto.unidad} / {producto.cantidadAlternativa} {producto.unidadAlternativa} - ${producto.precioPorUnidad}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          
            <button type='submit'>Agregar nuevo contenedor</button>
        </form>
    );
}

export default NuevoContenedor;
