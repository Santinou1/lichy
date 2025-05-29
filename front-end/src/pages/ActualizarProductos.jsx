import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmarEliminar from "../components/ConfirmarEliminar";
import DesglozarPorcolor from "../components/DesglozarPorColor";
import CrearColor from "../components/CrearColor";
import { useUserContext } from "../UserProvider";
import Select from 'react-select';

function ActualizarProductos() {

    const { user } = useUserContext();
    const { id } = useParams();
    const [contenedorProducto, setContendorProducto] = useState(null);
    const [colores, setColores] = useState([]);
    const [coloresOptions, setColoresOptions] = useState([]);
    const [color, setColor] = useState(false);
    const [producto, setProducto] = useState(null);
    const [productos, setProductos] = useState([]);
    const [motivo, setMotivo] = useState('');
    const [codigoInterno, setCodigoInterno] = useState('');
    const [cantidadRestante, setCantidadRestante] = useState(0);
    const [coloresAsignados, setColoresAsignados] = useState([]);
    const [dataAnterior, setDataAnterior] = useState(null);
    const nav = useNavigate();

    const volver = () => {
        nav(`/contenedor-detalle/${contenedorProducto.contenedor}`);
    }

    const handleColoresAsignadosChange = (nuevosColoresAsignados) => {
        setColoresAsignados(nuevosColoresAsignados);

        // Si no hay cantidad restante, actualiza la cantidad original a 0
        if (cantidadRestante === 0) {
            setContendorProducto((prev) => ({
                ...prev,
                cantidad: 0, // Actualiza la cantidad original a 0
            }));
        }
    };

    const handleCantidadRestanteChange = (nuevaCantidadRestante) => {
        setCantidadRestante(nuevaCantidadRestante);
    };

    // Manejar la creación de un nuevo color
    const handleColorCreated = (nuevoColor) => {
        // Actualizar la lista de colores
        setColores((prevColores) => [...prevColores, nuevoColor]);
        
        // Actualizar las opciones de colores para el Select
        const newOption = {
            value: nuevoColor.idColor.toString(),
            label: nuevoColor.nombre + (nuevoColor.codigoInterno ? ` (${nuevoColor.codigoInterno})` : ''),
            data: nuevoColor
        };
        setColoresOptions((prev) => [...prev, newOption]);
        
        // Si estamos en modo de color único, seleccionamos automáticamente el nuevo color
        if (color) {
            setContendorProducto((prev) => ({
                ...prev,
                idColor: nuevoColor.idColor
            }));
        }
    };

    useEffect(() => {
        axios.get(`http://localhost:5000/api/contenedorProducto/producto/${id}`).then((response) => {
            console.log(response.data);
            setContendorProducto(response.data[0]);
            setDataAnterior(response.data[0]);
            setCantidadRestante(response.data[0]?.cantidad || 0);
            setCodigoInterno(response.data[0]?.codigoInterno || '');
        }).catch((error) => {
            console.error('Error obteniendo los datos:', error);
        });
        
        axios.get('http://localhost:5000/api/items/color').then((response) => {
            setColores(response.data);
            
            // Formatear los colores para react-select
            const options = response.data.map(color => ({
                value: color.idColor.toString(),
                label: color.nombre + (color.codigoInterno ? ` (${color.codigoInterno})` : ''),
                data: color
            }));
            setColoresOptions(options);
        }).catch((error) => {
            console.error("Error trayendo colores:", error);
        });
        
        axios.get('http://localhost:5000/api/items/producto').then((response) => {
            setProductos(response.data);
        });
    }, []);

    useEffect(() => {
        setProducto(productos.find((prod) => prod.idProducto === contenedorProducto?.idProducto));
    }, [productos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Si se está cambiando la unidad, actualizar también la unidad alternativa
        if (name === 'unidad') {
            let unidadAlternativa = '';
            
            // Determinar la unidad alternativa según la nueva unidad principal
            if (value === 'm' || value === 'kg') {
                unidadAlternativa = 'rollos';
            } else if (value === 'uni') {
                unidadAlternativa = 'cajas';
            }
            
            setContendorProducto(prev => ({
                ...prev,
                [name]: value,
                unidadAlternativa: unidadAlternativa
            }));
        } else {
            setContendorProducto(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleColorSelectChange = (selectedOption) => {
        if (selectedOption) {
            setContendorProducto(prev => ({
                ...prev,
                idColor: parseInt(selectedOption.value)
            }));
        } else {
            setContendorProducto(prev => ({
                ...prev,
                idColor: null
            }));
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!contenedorProducto) {
            console.error('No se puede actualizar: contenedorProducto es null');
            return;
        }
        
        // Validar que el motivo sea obligatorio
        if (!motivo.trim()) {
            alert('Debe ingresar un motivo para la actualización');
            return;
        }
        
        // Validar que el código interno sea obligatorio (si existe)
        // Comentamos esta validación para que no sea obligatorio
        /*
        if (!codigoInterno || (typeof codigoInterno === 'string' && !codigoInterno.trim())) {
            alert('Debe ingresar un código interno para el producto');
            return;
        }
        */
        
        // Verificar si la unidad ha cambiado con respecto a los datos originales
        const unidadCambiada = dataAnterior?.unidad !== contenedorProducto?.unidad;
        
        const datosActualizados = {
            producto: contenedorProducto?.idProducto, // ID del producto
            cantidad: cantidadRestante === 0 ? cantidadRestante : contenedorProducto?.cantidad,
            unidad: contenedorProducto?.unidad,
            color: contenedorProducto?.idColor,
            precioPorUnidad: contenedorProducto?.precioPorUnidad,
            cantidadAlternativa: contenedorProducto?.cantidadAlternativa,
            unidadAlternativa: contenedorProducto?.unidadAlternativa,
            coloresAsignados: coloresAsignados,
            contenedor: contenedorProducto?.contenedor,
            item_proveedor: contenedorProducto?.item_proveedor,
            codigoInterno: codigoInterno,
            motivo: motivo,
            dataAnterior: dataAnterior,
            usuarioCambio: user.idUsuario,
            // Agregar flag para indicar si se debe actualizar la unidad en todos los productos relacionados
            actualizarUnidadEnTodosLosProductos: unidadCambiada
        };
        
        try {
            // Mostrar confirmación si la unidad ha cambiado
            if (unidadCambiada) {
                const confirmar = window.confirm(
                    `Has cambiado la unidad de medida de ${dataAnterior?.unidad} a ${contenedorProducto?.unidad}. \n\n` +
                    `¿Deseas aplicar este cambio a todos los productos "${producto?.nombre}" en todos los contenedores?\n\n` +
                    `- Si cambias de m/kg a uni: se cambiará la unidad alternativa de rollos a cajas.\n` +
                    `- Si cambias entre m y kg: se mantendrá la unidad alternativa como rollos.`
                );
                
                if (!confirmar) {
                    datosActualizados.actualizarUnidadEnTodosLosProductos = false;
                }
            }
            
            const response = await axios.put(`http://localhost:5000/api/contenedorProducto/${contenedorProducto?.idContenedorProductos}`, datosActualizados);
            if (response.status === 200) {
                console.log(response.data);
                volver();
            }
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            alert('Hubo un error al actualizar el producto.');
        }
    }

    // Encontrar la opción de color seleccionada actualmente
    const selectedColorOption = coloresOptions.find(
        option => option.value === (contenedorProducto?.idColor?.toString() || '')
    );

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
        <div className='nuevo-contenedor-container'>
            <button onClick={volver}>Volver</button>
            {
                !contenedorProducto ? <p>Cargando...</p> : <>
                    <h1 className='titulo'> Actualizar {producto?.nombre} de contendor {id}</h1>
                    <div className='input-container'>
                        <label>Producto:</label>
                        <select name='idProducto' value={contenedorProducto?.idProducto || ''} onChange={handleInputChange}>
                            <option value=''>Seleccionar producto</option>
                            {productos.map((prod) => (
                                <option key={prod.idProducto} value={prod.idProducto}>
                                    {prod.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='input-container'>
                        <label>Color:</label>
                        {
                            color ?
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            options={coloresOptions}
                                            value={selectedColorOption}
                                            onChange={handleColorSelectChange}
                                            placeholder="Buscar o seleccionar color..."
                                            isClearable
                                            isSearchable
                                            styles={customStyles}
                                            noOptionsMessage={() => "No se encontraron colores"}
                                        />
                                    </div>
                                    <CrearColor onColorCreated={handleColorCreated} />
                                </div> : 
                                <DesglozarPorcolor
                                    producto={contenedorProducto}
                                    colores={colores}
                                    coloresOptions={coloresOptions}
                                    onColoresAsignadosChange={handleColoresAsignadosChange}
                                    onCantidadRestanteChange={handleCantidadRestanteChange}
                                    onColorCreated={handleColorCreated}
                                    onDistribucionGuardada={(data) => {
                                        // Fetch updated data before redirecting
                                        axios.get(`http://localhost:5000/api/contenedorProducto/${contenedorProducto.contenedor}`)
                                            .then(response => {
                                                // Ensure data is refreshed in the parent component
                                                // Then redirect to the container detail page
                                                nav(`/contenedor-detalle/${contenedorProducto.contenedor}`);
                                            })
                                            .catch(error => {
                                                console.error('Error fetching updated products:', error);
                                                // Still redirect even if there's an error
                                                nav(`/contenedor-detalle/${contenedorProducto.contenedor}`);
                                            });
                                    }}
                                />
                        }
                    </div>
                    <div className='input-container'>
                        <label>Código Interno: <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type='text'
                            name='codigoInterno'
                            value={codigoInterno}
                            onChange={(e) => setCodigoInterno(e.target.value)}
                            placeholder="Ingrese el código interno"
                            required
                        />
                    </div>
                    <div className='input-container'>
                        <label>Cantidad:</label>
                        <input
                            type='number'
                            name='cantidad'
                            value={contenedorProducto?.cantidad || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div className='input-container'>
                        <label>Unidad:</label>
                        <select
                            type='text'
                            name='unidad'
                            value={contenedorProducto?.unidad || ''}
                            onChange={handleInputChange}
                        >
                            <option value='' disabled>Seleccionar unidad</option>
                            <option value='m'>m</option>
                            <option value='kg'>kg</option>
                            <option value='uni'>uni</option>
                        </select>
                    </div>
                    <div className='input-container'>
                        <label>FOB:</label>
                        <input
                            type='number'
                            name='precioPorUnidad'
                            placeholder='Precio por unidad'
                            value={contenedorProducto?.precioPorUnidad || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='input-container'>
                        <label htmlFor='fob'>Item Proveedor:</label>
                        <input type='text' name='item_proveedor' value={contenedorProducto?.item_proveedor || ''} onChange={handleInputChange} />
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                        <h4>Medición Alternativa</h4>
                        <div className='input-container'>
                            <label>Cantidad Alternativa:</label>
                            <input
                                type='number'
                                name='cantidadAlternativa'
                                placeholder='Cantidad alternativa'
                                value={contenedorProducto?.cantidadAlternativa || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='input-container'>
                            <label>Unidad Alternativa:</label>
                            <select
                                name='unidadAlternativa'
                                value={contenedorProducto?.unidadAlternativa || ''}
                                disabled={true} // Siempre deshabilitado, se selecciona automáticamente
                                onChange={handleInputChange}
                            >
                                <option value='' disabled>Seleccionar unidad alternativa</option>
                                <option value='rollos'>Rollos</option>
                                <option value='cajas'>Cajas</option>
                            </select>
                            <p style={{ fontSize: '0.8em', color: '#666' }}>
                                {contenedorProducto?.unidad === 'm' || contenedorProducto?.unidad === 'kg' ? 'Para productos medidos en m o kg, se usa automáticamente rollos' :
                                    contenedorProducto?.unidad === 'uni' ? 'Para productos medidos en unidades, se usa automáticamente cajas' :
                                        'Seleccione una unidad principal primero'}
                            </p>
                            {dataAnterior && dataAnterior.unidad !== contenedorProducto?.unidad && (
                                <div style={{ marginTop: '5px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeeba' }}>
                                    <p style={{ fontSize: '0.9em', color: '#856404', margin: 0 }}>
                                        <strong>Nota:</strong> Has cambiado la unidad de medida. Al guardar, podrás elegir si aplicar este cambio a todos los productos "{producto?.nombre}" en todos los contenedores.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='input-container'>
                        <label>Motivo de actualizacion:</label>
                        <input type='text' name='motivo' value={motivo} onChange={(e) => { setMotivo(e.target.value) }}></input>
                    </div>
                </>

            }
            {contenedorProducto && (
                <ConfirmarEliminar 
                    id={id} 
                    tipo={'ContenedorProducto'} 
                    motivo={motivo} 
                    usuario={user.idUsuario} 
                    contenedor={contenedorProducto.contenedor} 
                />
            )}
            <button onClick={onSubmit}>Actualizar</button>

        </div>
    );
}

export default ActualizarProductos;
