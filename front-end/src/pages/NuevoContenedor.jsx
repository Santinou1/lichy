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
    const [productos, setProductos] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [redirigir, setRedirigir] = useState(false);
    const [unidadDeshabilitada, setUnidadDeshabilitada] = useState(false);
    
    // Cargar datos iniciales
    useEffect(() => {
        axios.get('http://localhost:5000/api/items/proveedor')
            .then((response) => {
                setProveedores(response.data);
            })
            .catch((error) => {
                console.error('Error trayendo los proveedores:', error);
            });

        axios.get('http://localhost:5000/api/items/producto')
            .then((response) => {
                const formattedProducts = response.data.map((item) => ({
                    value: item.idProducto.toString(),
                    label: item.nombre,
                    unidadPredeterminada: item.unidadPredeterminada,
                }));
                setProductos(formattedProducts);
            })
            .catch((error) => {
                console.error('Error trayendo los productos:', error);
            });
    }, []);

    // Manejar la creación de nuevos productos
    const handleCreateProduct = async (inputValue) => {
        // Mostrar un diálogo para seleccionar la unidad predeterminada
        const unidad = prompt("Selecciona la unidad predeterminada para el nuevo producto (m, kg, uds):");
        
        if (!unidad) {
            alert("Debes seleccionar una unidad predeterminada para crear un producto");
            return null;
        }
        
        if (!['m', 'kg', 'uds'].includes(unidad)) {
            alert("La unidad debe ser 'm', 'kg' o 'uds'");
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
        const precioPorUnidadActual = watch('precioPorUnidad');
        const itemProveedor = watch('item_proveedor');
        
        if (!productoActual || !unidadActual || !cantidadActual || !precioPorUnidadActual) {
            alert('Todos los campos del producto son obligatorios');
            return;
        }

        // Valores predeterminados para los campos requeridos por el backend
        const cantidadBulto = 1;
        const tipoBulto = 'CAJA';

        const nuevoProducto = {
            idProducto: productoActual.value.startsWith('temp-') ? null : productoActual.value,
            nombre: productoActual.label,
            unidad: unidadActual,
            cantidad: cantidadActual,
            cantidadBulto: cantidadBulto,
            tipoBulto: tipoBulto,
            precioPorUnidad: precioPorUnidadActual,
            item_proveedor: itemProveedor
        };

        setProductosSeleccionados((prev) => [...prev, nuevoProducto]);

        // Limpiar los campos del producto
        setValue('producto', null);
        setValue('unidad', '');
        setValue('cantidad', '');
        setValue('precioPorUnidad', '');
        setValue('item_proveedor', '');
        setUnidadDeshabilitada(false); 
    };

    const handleProductChange = (selectedOption) => {
        if (selectedOption && !selectedOption.value.startsWith('temp-')) {
            // Si el producto es existente, establecer la unidad predeterminada y deshabilitar el campo
            const productoSeleccionado = productos.find(p => p.value === selectedOption.value);
            setValue('unidad', productoSeleccionado.unidadPredeterminada);
            setUnidadDeshabilitada(true);
        } else {
            // Si el producto es nuevo, habilitar el campo de unidad
            setUnidadDeshabilitada(false);
        }
        setValue('producto', selectedOption);
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
            
            const dataConUser = {
                ...data,
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
                <label htmlFor='proveedor'>Agente:</label>
                <select className='input-nuevoContenedor' {...register('proveedor')}>
                    <option value=''>Seleccione un agente</option>
                    {proveedores.map((item) => (
                        <option key={item.idProveedor} value={item.idProveedor}>
                            {item.nombre}
                        </option>
                    ))}
                </select>
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
                                handleProductChange(selectedOption);
                                field.onChange(selectedOption);
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
                    <select className='input-nuevoContenedor' {...register('unidad')} disabled={unidadDeshabilitada}>
                        <option value='' disabled>Seleccionar unidad</option>
                        <option value='m'>m</option>
                        <option value='kg'>kg</option>
                        <option value='uds'>uds</option>
                    </select>
                </div>
                <div className='input-container'>
                    <label htmlFor='cantidad'>Cantidad:</label>
                    <input type='number' className='input-nuevoContenedor' {...register('cantidad')} />
                </div>
                <div className='input-container'>
                    <label htmlFor='fob'>FOB:</label>
                    <input type='number' step='any' className='input-nuevoContenedor' {...register('precioPorUnidad')} /> 
                </div>
                <div className='input-container'>
                    <label htmlFor='fob'>Item Proveedor:</label>
                    <input type='text' step='any' className='input-nuevoContenedor' {...register('item_proveedor')} /> 
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
                                {producto.nombre} - {producto.cantidad} {producto.unidad} - ${producto.precioPorUnidad}
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