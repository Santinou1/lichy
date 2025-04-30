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
            console.log(response.data[0]);
            setContendorProducto(response.data[0]);
            setDataAnterior(response.data[0]);
            setCantidadRestante(response.data[0].cantidad);
            setColor(response.data[0].idColor);
            setProducto(response.data[0].idProducto);

        }).catch((error) => {
            console.error("Error trayendo producto de contenedor:", error);
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
        setContendorProducto(prev => ({
            ...prev,
            [name]: value,
        }));
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
            motivo: motivo,
            dataAnterior: dataAnterior,
            usuarioCambio: user.idUsuario,
        };
        
        try {
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
                                />
                        }
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
