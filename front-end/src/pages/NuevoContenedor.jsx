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
        axios.get('http://localhost:3000/api/items/proveedor')
            .then((response) => {
                setProveedores(response.data);
            })
            .catch((error) => {
                console.error('Error trayendo los proveedores:', error);
            });

        axios.get('http://localhost:3000/api/items/producto')
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
    const handleCreateProduct = (inputValue) => {
        const newOption = { value: `temp-${uuidv4()}`, label: inputValue };
        setProductos((prev) => [...prev, newOption]);
        setValue('producto', newOption);
        setUnidadDeshabilitada(false);
        return newOption;
    };
    // Agregar uin producto a la lista
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

        const nuevoProducto = {
            idProducto: productoActual.value.startsWith('temp-') ? null : productoActual.value,
            nombre: productoActual.label,
            unidad: unidadActual,
            cantidad: cantidadActual,
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
        const dataConUser = {
            ...data,
            usuario: user.idUsuario,
            productos: productosSeleccionados,
        };

        try {
            await axios.post('http://localhost:3000/api/contenedores', dataConUser);
            setRedirigir(true);
        } catch (error) {
            alert('Error al enviar el formulario:', error);
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