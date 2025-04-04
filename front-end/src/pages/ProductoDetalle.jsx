import '../styles/ProductoDetalle.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import { obtenerColoresConNombres } from '../utils/formatearNombreDeColor';
function ProductoDetalle() {
    const navigate = useNavigate();
    const { producto } = useParams();
    const [mostrarColumnas, setMostrarColumnas] = useState(false);
    const [getProducto, setGetProducto] = useState(null);
    const [cantidadPorColor, setCantidadPorColor] = useState([]);
    const [cantidadPorContenedor, setCantidadPorContenedor] = useState([]);
    const [cantidadTotal, setCantidadTotal] = useState(0);
    const [filtro, setFiltro] = useState('');
    const [estadoOubicacion, setEstadoOUbicacion] = useState('');
    const [estados, setEstados] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        unidadPredeterminada: '',
        codigoInterno: ''
    });
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    const redirigir = () => navigate('/ver-productos');
    const redirigirContenedor = (contenedor) => navigate(`/contenedor-detalle/${contenedor}?volver=detalles-prod&producto=${producto}`);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cantidadColorRes, productoRes, cantidadContenedorRes, cantidadTotalRes, estadosRes, ubicacionesRes] = await Promise.all([
                    axios.get(`http://localhost:3000/api/producto/cantidad-por-color/${producto}`),
                    axios.get(`http://localhost:3000/api/items/producto/${producto}`),
                    axios.get(`http://localhost:3000/api/producto/cantidad-por-contenedor/${producto}`),
                    axios.get(`http://localhost:3000/api/producto/cantidad-total/${producto}`),
                    axios.get('http://localhost:3000/api/items/categorias'),
                    axios.get('http://localhost:3000/api/items/ubicaciones')
                ]);

                const cantidadPorColorNombres = await obtenerColoresConNombres(cantidadColorRes.data);
                console.log(cantidadPorColorNombres)
                setCantidadPorColor(cantidadPorColorNombres);
                setGetProducto(productoRes.data);
                setFormData(productoRes.data)
                setCantidadPorContenedor(cantidadContenedorRes.data);
                setCantidadTotal(cantidadTotalRes.data[0].cantidad_total);
                setEstados(estadosRes.data);
                setUbicaciones(ubicacionesRes.data);
            } catch (error) {
                console.error('Error al cargar los datos:', error);
            }
        };

        fetchData();
    }, [producto]);

    const filtrar = async () => {
        try {
            if (filtro && filtro !== 'color') {
                const response = await axios.get(`http://localhost:3000/api/producto/cantidad-filtro/${producto}`, {
                    headers: {
                        'x-filtro': filtro,
                        'x-estado-o-ubicacion': estadoOubicacion
                    }
                });
                console.log(response.data)
                const cantidadPorColorNombre = await obtenerColoresConNombres(response.data);
                setMostrarColumnas(true)
                setCantidadPorColor(cantidadPorColorNombre);
                
            } else {
                setFiltro('');
                setEstadoOUbicacion('');
                const response = await axios.get(`http://localhost:3000/api/producto/cantidad-por-color/${producto}`);
                const cantidadPorColorNombre = await obtenerColoresConNombres(response.data);
                setCantidadPorColor(cantidadPorColorNombre);
               
            }
        } catch (error) {
            console.error('Error aplicando el filtro:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put(`http://localhost:3000/api/items/producto/${producto}`, formData);
            setMensaje({ texto: 'Producto actualizado con éxito', tipo: 'exito' });
            setGetProducto(response.data);

            setTimeout(() => {
                setEditando(false);
                setMensaje({ texto: '', tipo: '' });
            }, 2000);
        } catch (error) {
            console.error('Error actualizando producto:', error);
            setMensaje({ texto: 'Error al actualizar el producto', tipo: 'error' });
        }
    };

    return (
        <div className='contenedor-producto-detalle'>
            <div className='producto-detalle'>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h1 className='titulo'>Detalle de {getProducto?.nombre || 'Producto'}</h1>
                    <button onClick={redirigir}>Volver</button>
                </div>
                <hr />
                <label>Filtrar:</label>
                <select onChange={(e) => setFiltro(e.target.value)}>
                    <option value='color'>Color</option>
                    <option value='ubicacion'>Ubicación</option>
                    <option value='estado'>Estado</option>
                </select>
                {filtro === 'estado' && (
                    <select onChange={(e) => setEstadoOUbicacion(e.target.value)} required>
                        {estados.map((item, index) => (
                            <option key={index} value={item.nombreCategoria}>{item.nombreCategoria}</option>
                        ))}
                    </select>
                )}
                {filtro === 'ubicacion' && (
                    <select onChange={(e) => setEstadoOUbicacion(e.target.value)} required>
                        {ubicaciones.map((item, index) => (
                            <option key={index} value={item.nombreUbicacion}>{item.nombreUbicacion}</option>
                        ))}
                    </select>
                )}
                <button onClick={filtrar}>Filtrar</button>

                <h2 className='titulo'>Cantidad por {filtro || 'color'}:</h2>
                <table className='tabla-detalle' >
                    <thead style={{width:'40%', background:'gray'}}>
                        <tr >
                            <th>Color</th>
                            <th>Cantidad</th>
                            {filtro && estadoOubicacion && mostrarColumnas &&(
                                <>
                                    <th>Estado</th>
                                    <th>Ubicación</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {cantidadPorColor.length ? cantidadPorColor.map((item, index) => (
                            <tr>
                                <th>{item.color || 'Sin color'}</th>
                                <th>{`${item.total_cantidad} ${item.unidad}`}</th>
                                {filtro && estadoOubicacion && mostrarColumnas && (
                                    <>
                                        <th>{item.estado}</th>
                                        <th>{item.ubicacion}</th>
                                    </>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan={filtro && estadoOubicacion ? 4 : 2}>No hay coincidencias.</td></tr>
                        )}
                    </tbody>
                </table>

                <h2>Producto en contenedores:</h2>
                <h3 className='titulo'>Cantidad total: {cantidadTotal}</h3>
                <table className='tabla-detalle'>
                    <thead style={{width:'40%', background:'gray'}}> 
                        <tr>
                            <th>Contenedor</th>
                            <th>Cantidad</th>
                            <th>Color</th>
                            <th>Item proveedor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cantidadPorContenedor.map((item, index) => (
                            <tr key={index}>
                                <th>{item.contenedor}</th>
                                <th>{item.cantidad ? `${item.cantidad} ${item.unidad}` : 'Sin cantidad'}</th>
                                <th>{item.nombre || 'Sin color'}</th>
                                <th>{item.item_proveedor || '-'}</th>
                                <td><button onClick={() => redirigirContenedor(item.contenedor)}>Ver contenedor</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <hr />
                <h2>Detalles:</h2>
                {getProducto && (
                    editando ? (
                        <form onSubmit={handleSubmit}>
                            {mensaje.texto && (
                                <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
                            )}
                            <div>
                                <label>Nombre:</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label>Unidad predeterminada:</label>
                                <select
                                    type="text"
                                    name="unidadPredeterminada"
                                    value={formData.unidadPredeterminada}
                                    onChange={handleInputChange}
                                    required
                                >

                                    <option value='' disabled>Seleccionar unidad</option>
                                    <option value='m'>m</option>
                                    <option value='kg'>kg</option>
                                    <option value='uni'>uni</option>
                                </select>
                            </div>
                            <div>
                                <label>Código interno:</label>
                                <input
                                    type="text"
                                    name="codigoInterno"
                                    value={formData.codigoInterno}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <button type="submit">Guardar cambios</button>
                            <button type="button" onClick={() => setEditando(false)}>Cancelar</button>
                        </form>
                    ) : (
                        <>
                            <p>Unidad predeterminada: <b>{getProducto.unidadPredeterminada}</b></p>
                            <p>Código interno: <b>{getProducto.codigoInterno || 'Sin código interno'}</b></p>
                            <button onClick={() => setEditando(true)}>Editar campos</button>
                        </>
                    )
                )}

                <ConfirmarEliminar tipo='producto' id={producto} />
            </div>
        </div>
    );
}

export default ProductoDetalle;
