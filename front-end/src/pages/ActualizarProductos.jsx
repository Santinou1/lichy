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
    const [contenedorproducto, setContendorproducto] = useState(null);
    const [colores, setColores] = useState([]);
    const [coloresoptions, setColoresoptions] = useState([]);
    const [color, setColor] = useState(false);
    const [producto, setProducto] = useState(null);
    const [productos, setProductos] = useState([]);
    const [motivo, setMotivo] = useState('');
    const [codigointerno, setCodigointerno] = useState('');
    const [cantidadrestante, setCantidadrestante] = useState(0);
    const [coloresasignados, setColoresasignados] = useState([]);
    const [dataanterior, setDataanterior] = useState(null);
    const nav = useNavigate();

    const volver = () => {
        nav(`/contenedor-detalle/${contenedorproducto.contenedor}`);
    }

    const handleColoresasignadosChange = (nuevosColoresasignados) => {
        setColoresasignados(nuevosColoresasignados);

        // Si no hay cantidad restante, actualiza la cantidad original a 0
        if (cantidadrestante === 0) {
            setContendorproducto((prev) => ({
                ...prev,
                cantidad: 0, // Actualiza la cantidad original a 0
            }));
        }
    };

    const handleCantidadrestanteChange = (nuevaCantidadrestante) => {
        setCantidadrestante(nuevaCantidadrestante);
    };

    // Manejar la creación de un nuevo color
    const handleColorCreated = (nuevoColor) => {
        // Actualizar la lista de colores
        setColores((prevColores) => [...prevColores, nuevoColor]);
        
        // Actualizar las opciones de colores para el Select
        const newOption = {
            value: nuevoColor.idcolor.toString(),
            label: nuevoColor.nombre + (nuevoColor.codigointerno ? ` (${nuevoColor.codigointerno})` : ''),
            data: nuevoColor
        };
        setColoresoptions((prev) => [...prev, newOption]);
        
        // Si estamos en modo de color único, seleccionamos automáticamente el nuevo color
        if (color) {
            setContendorproducto((prev) => ({
                ...prev,
                idcolor: nuevoColor.idcolor
            }));
        }
    };

    useEffect(() => {
        axios.get(`http://192.168.0.131:5000/api/contenedorproducto/producto/${id}`).then((response) => {
            console.log(response.data);
            setContendorproducto(response.data[0]);
            setDataanterior(response.data[0]);
            setCantidadrestante(response.data[0]?.cantidad || 0);
            setCodigointerno(response.data[0]?.codigointerno || '');
        }).catch((error) => {
            console.error('Error obteniendo los datos:', error);
        });
        
        axios.get('http://192.168.0.131:5000/api/items/color').then((response) => {
            setColores(response.data);
            
            // Formatear los colores para react-select
            const options = response.data.map(color => ({
                value: color.idcolor.toString(),
                label: color.nombre + (color.codigointerno ? ` (${color.codigointerno})` : ''),
                data: color
            }));
            setColoresoptions(options);
        }).catch((error) => {
            console.error("Error trayendo colores:", error);
        });
        
        axios.get('http://192.168.0.131:5000/api/items/producto').then((response) => {
            setProductos(response.data);
        });
    }, []);

    useEffect(() => {
        setProducto(productos.find((prod) => prod.idproducto === contenedorproducto?.idproducto));
    }, [productos]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Si se está cambiando la unidad, actualizar también la unidad alternativa
        if (name === 'unidad') {
            let unidadalternativa = '';
            
            // Determinar la unidad alternativa según la nueva unidad principal
            if (value === 'm' || value === 'kg') {
                unidadalternativa = 'rollos';
            } else if (value === 'uni') {
                unidadalternativa = 'cajas';
            }
            
            setContendorproducto(prev => ({
                ...prev,
                [name]: value,
                unidadalternativa: unidadalternativa
            }));
        } else {
            setContendorproducto(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleColorSelectChange = (selectedOption) => {
        if (selectedOption) {
            setContendorproducto(prev => ({
                ...prev,
                idcolor: parseInt(selectedOption.value)
            }));
        } else {
            setContendorproducto(prev => ({
                ...prev,
                idcolor: null
            }));
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!contenedorproducto) {
            console.error('No se puede actualizar: contenedorproducto es null');
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
        if (!codigointerno || (typeof codigointerno === 'string' && !codigointerno.trim())) {
            alert('Debe ingresar un código interno para el producto');
            return;
        }
        */
        
        // Verificar si la unidad ha cambiado con respecto a los datos originales
        const unidadcambiada = dataanterior?.unidad !== contenedorproducto?.unidad;
        
        // Normalizar ids para compatibilidad
        const idproducto = contenedorproducto?.idproducto || contenedorproducto?.idproducto;
        const idcontenedor = contenedorproducto?.contenedor || contenedorproducto?.idcontenedor;
        const idcontenedorproducto = contenedorproducto?.idcontenedorproducto || contenedorproducto?.idContenedorproducto;
        const datosactualizados = {
            producto: Number(idproducto),
            cantidad: cantidadrestante === 0 ? cantidadrestante : contenedorproducto?.cantidad,
            unidad: contenedorproducto?.unidad,
            color: contenedorproducto?.idcolor || contenedorproducto?.idcolor,
            precioPorUnidad: contenedorproducto?.precioPorUnidad,
            cantidadalternativa: contenedorproducto?.cantidadalternativa,
            unidadalternativa: contenedorproducto?.unidadalternativa,
            coloresasignados: coloresasignados,
            contenedor: Number(idcontenedor),
            item_proveedor: contenedorproducto?.item_proveedor,
            codigointerno: codigointerno || contenedorproducto?.codigointerno,
            motivo: motivo,
            dataanterior: dataanterior,
            usuariocambio: user.idusuario,
            actualizarUnidadEnTodosLosProductos: unidadcambiada
        };
        
        try {
            // Mostrar confirmación si la unidad ha cambiado
            if (unidadcambiada) {
                const confirmar = window.confirm(
                    `Has cambiado la unidad de medida de ${dataanterior?.unidad} a ${contenedorproducto?.unidad}. \n\n` +
                    `¿Deseas aplicar este cambio a todos los productos "${producto?.nombre}" en todos los contenedores?\n\n` +
                    `- Si cambias de m/kg a uni: se cambiará la unidad alternativa de rollos a cajas.\n` +
                    `- Si cambias entre m y kg: se mantendrá la unidad alternativa como rollos.`
                );
                
                if (!confirmar) {
                    datosactualizados.actualizarUnidadEnTodosLosProductos = false;
                }
            }
            
            const response = await axios.put(`http://192.168.0.131:5000/api/contenedorproducto/${idcontenedorproducto}`, datosactualizados);
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
    const selectedColorOption = coloresoptions.find(
        option => option.value === (contenedorproducto?.idcolor?.toString() || '')
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
                !contenedorproducto ? <p>Cargando...</p> : <>
                    <h1 className='titulo'> Actualizar {producto?.nombre} de contendor {id}</h1>
                    <div className='input-container'>
                        <label>Producto:</label>
                        <select name='idproducto' value={contenedorproducto?.idproducto || ''} onChange={handleInputChange}>
                            <option value=''>Seleccionar producto</option>
                            {productos.map((prod) => (
                                <option key={prod.idproducto} value={prod.idproducto}>
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
                                            options={coloresoptions}
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
                                    producto={contenedorproducto}
                                    colores={colores}
                                    coloresoptions={coloresoptions}
                                    onColoresasignadosChange={handleColoresasignadosChange}
                                    onCantidadrestanteChange={handleCantidadrestanteChange}
                                    onColorCreated={handleColorCreated}
                                    onDistribucionGuardada={(data) => {
                                        // Fetch updated data before redirecting
                                        axios.get(`http://192.168.0.131:5000/api/contenedorproducto/${contenedorproducto.contenedor}`)
                                            .then(response => {
                                                // Ensure data is refreshed in the parent component
                                                // Then redirect to the container detail page
                                                nav(`/contenedor-detalle/${contenedorproducto.contenedor}`);
                                            })
                                            .catch(error => {
                                                console.error('Error fetching updated products:', error);
                                                // Still redirect even if there's an error
                                                nav(`/contenedor-detalle/${contenedorproducto.contenedor}`);
                                            });
                                    }}
                                />
                        }
                    </div>
                    <div className='input-container'>
                        <label>Código Interno: <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type='text'
                            name='codigointerno'
                            value={codigointerno}
                            onChange={(e) => setCodigointerno(e.target.value)}
                            placeholder="Ingrese el código interno"
                            required
                        />
                    </div>
                    <div className='input-container'>
                        <label>Cantidad:</label>
                        <input
                            type='number'
                            name='cantidad'
                            value={contenedorproducto?.cantidad || ''}
                            onChange={handleInputChange} />
                    </div>
                    <div className='input-container'>
                        <label>Unidad:</label>
                        <select
                            type='text'
                            name='unidad'
                            value={contenedorproducto?.unidad || ''}
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
                            value={contenedorproducto?.precioPorUnidad || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className='input-container'>
                        <label htmlFor='fob'>Item Proveedor:</label>
                        <input type='text' name='item_proveedor' value={contenedorproducto?.item_proveedor || ''} onChange={handleInputChange} />
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
                        <h4>Medición Alternativa</h4>
                        <div className='input-container'>
                            <label>Cantidad Alternativa:</label>
                            <input
                                type='number'
                                name='cantidadalternativa'
                                placeholder='Cantidad alternativa'
                                value={contenedorproducto?.cantidadalternativa || ''}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className='input-container'>
                            <label>Unidad Alternativa:</label>
                            <select
                                name='unidadalternativa'
                                value={contenedorproducto?.unidadalternativa || ''}
                                disabled={true} // Siempre deshabilitado, se selecciona automáticamente
                                onChange={handleInputChange}
                            >
                                <option value='' disabled>Seleccionar unidad alternativa</option>
                                <option value='rollos'>Rollos</option>
                                <option value='cajas'>Cajas</option>
                            </select>
                            <p style={{ fontSize: '0.8em', color: '#666' }}>
                                {contenedorproducto?.unidad === 'm' || contenedorproducto?.unidad === 'kg' ? 'Para productos medidos en m o kg, se usa automáticamente rollos' :
                                    contenedorproducto?.unidad === 'uni' ? 'Para productos medidos en unidades, se usa automáticamente cajas' :
                                        'Seleccione una unidad principal primero'}
                            </p>
                            {dataanterior && dataanterior.unidad !== contenedorproducto?.unidad && (
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
            {contenedorproducto && (
                <ConfirmarEliminar 
                    id={id} 
                    tipo={'Contenedorproducto'} 
                    motivo={motivo} 
                    usuario={user.idusuario} 
                    contenedor={contenedorproducto.contenedor} 
                />
            )}
            <button onClick={onSubmit}>Actualizar</button>

        </div>
    );
}

export default ActualizarProductos;
