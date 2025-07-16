import Producto from '../components/Producto';
import '../styles/ContenedorDetalle.css';
import '../styles/EdicionLotes.css';
import '../styles/Modal.css';
import { useNavigate, useParams, useSearchParams} from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import ActualizarCategoria from '../components/ActualizarCategoria';
import ActualizarEstado from '../components/ActualizarEstado';
import ActualizarDetalles from './ActualizarDetalles';
import ConfirmarEliminar from '../components/ConfirmarEliminar';
import AgregarProducto from '../components/AgregarProducto';
import { fechaISOtoReadable } from '../utils/fecha';
import VerHistorial from '../components/VerHistorial';
import EnvioPedidoMasivo from '../components/EnvioPedidoMasivo';

function ContendorDetalle({user}){
    const navigate = useNavigate();
    const redirigir = ()=>{
       let ruta = ''
        if(volver === 'contenedores'){
            ruta = '/ver-contenedores'
       }else{
        ruta = `/producto-detalle/${producto}`
       }
       console.log(ruta)
       navigate(ruta)
    }
    const [searchParams] = useSearchParams();
    const volver  = searchParams.get('volver');
    const producto = searchParams.get('producto');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mostrarActualizarEstado, setMostrarActualizarEstado] = useState(false);
    const [mostrarActualizarCategoria, setMostrarActualizarCategoria] = useState(false);
    const [mostrarActualizarDetalles, setMostrarActualizarDetalles] = useState(false);
    const [productos, setProductos] = useState([]);
    const [data, setData]= useState(null);
    const [historial, setHistorial] = useState(null);
    const [fechaCreacionOriginal, setFechaCreacionOriginal] = useState(null);
    const {id} = useParams();
    const [agregarProducto, setAgregarProducto] = useState(false);
    const [modoEdicionLotes, setModoEdicionLotes] = useState(false);
    const [productosEditados, setProductosEditados] = useState({});
    const [mostrarCambioEstadoMasivo, setMostrarCambioEstadoMasivo] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');

    const actualizarProductoEnLista = (nuevaListaProductos) => {
        setProductos(nuevaListaProductos);
    };
    
    // Función para activar/desactivar el modo de edición por lotes
    const toggleModoEdicionLotes = () => {
        if (modoEdicionLotes) {
            // Si estamos saliendo del modo edición, limpiamos los productos editados
            setProductosEditados({});
        }
        setModoEdicionLotes(!modoEdicionLotes);
    };
    
    // Función para registrar los cambios de un producto en el modo de edición por lotes
    const registrarCambioProducto = (idProducto, cambios) => {
        setProductosEditados(prev => ({
            ...prev,
            [idProducto]: {
                ...prev[idProducto],
                ...cambios
            }
        }));
    };
    
    // Función para guardar todos los cambios de productos en lote
    const guardarCambiosLote = async () => {
        try {
            // Crear un array de promesas para todas las actualizaciones
            const promesas = Object.entries(productosEditados).map(([idProducto, cambios]) => {
                return axios.put(`http://gestion.lichy.local:5000/api/contenedorProducto/${idProducto}`, {
                    ...cambios,
                    contenedor: id,
                    // Incluir los datos necesarios para el historial
                    dataAnterior: {
                        idContenedorProductos: idProducto,
                        nombre: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.nombre || '',
                        codigoInterno: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.codigoInterno || '',
                        cantidad: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.cantidad || 0,
                        unidad: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.unidad || '',
                        color: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.idColor || '',
                        precioPorUnidad: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.precioPorUnidad || 0,
                        cantidadAlternativa: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.cantidadAlternativa || null,
                        unidadAlternativa: productos.find(p => p.idContenedorProductos.toString() === idProducto)?.unidadAlternativa || null
                    },
                    usuarioCambio: user.username || 'sistema',
                    motivo: 'Edición en lote'
                });
            });
            
            // Ejecutar todas las actualizaciones en paralelo
            await Promise.all(promesas);
            
            // Actualizar la lista de productos
            const response = await axios.get(`http://gestion.lichy.local:5000/api/contenedorProducto/${id}`);
            setProductos(response.data);
            
            // Salir del modo edición por lotes
            setModoEdicionLotes(false);
            setProductosEditados({});
            
            alert('Todos los cambios se han guardado correctamente');
            
        } catch (error) {
            console.error('Error al guardar los cambios en lote:', error);
            alert('Hubo un error al guardar los cambios. Por favor, inténtelo de nuevo.');
        }
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const toggleCambioEstadoMasivo = () => {
        // Mostrar/ocultar el modal de EnvioPedidoMasivo
        setMostrarCambioEstadoMasivo(!mostrarCambioEstadoMasivo);
    };
    const actualizarCategoria = () => setMostrarActualizarCategoria(!mostrarActualizarCategoria);
    const actualizarEstado = (estado)=>{
        if(mostrarActualizarEstado){
            setData(prevData => ({
                ...prevData,
                categoria: estado
            }));
            setMostrarActualizarEstado(false)

        }else{
            setMostrarActualizarEstado(true);
        }
    };
    const actualizarDetalles = () => {
        setMostrarActualizarDetalles(!mostrarActualizarDetalles)
        if(mostrarActualizarEstado){
            setMostrarActualizarEstado(false)
        }if(mostrarActualizarCategoria){
            setMostrarActualizarCategoria(false)
        }
    }

    const handleCambioEstadoExitoso = (resultado) => {
        console.log('Cambio de estado exitoso:', resultado);
        setMensajeExito('Cambio de estado masivo realizado con éxito.');
        // Recargar los productos para reflejar los cambios
        axios.get(`http://gestion.lichy.local:5000/api/contenedorProducto/contenedor/${id}`)
            .then(res => {
                setProductos(res.data);
                // Limpiar el mensaje después de 3 segundos
                setTimeout(() => setMensajeExito(''), 3000);
            })
            .catch(err => console.error('Error al recargar productos:', err));
    };

    useEffect(()=>{
        console.log(id)
        axios.get(`http://gestion.lichy.local:5000/api/contenedores/contenedor-detalle/${id}`).then((response)=>{
            setData(response.data[0]);
            console.log(response.data);
        });
        axios.get(`http://gestion.lichy.local:5000/api/contenedorEstado/${id}`).then((response)=>{
            console.log(response.data); 
            setHistorial(response.data);
            
            // Obtener la fecha de creación del último registro de historial (el más antiguo)
            if (response.data && response.data.length > 0) {
                // El historial viene ordenado por idEstado DESC, por lo que el último elemento es el más antiguo
                const ultimoEstado = response.data[response.data.length - 1];
                setFechaCreacionOriginal(ultimoEstado.fechaHora);
            }
        });
        axios.get(`http://gestion.lichy.local:5000/api/contenedorProducto/${id}`).then((response)=>{
            setProductos(response.data);
        });

    },[]);
    return(

        <div className="contenedor-detalle-container">
            <div className='encabezados-container'>
                {
                    data ? 
                    <>
                    <> 
                        <h1 className='titulo' >Interno: {data.idContenedor}</h1>
                        <h1 className='titulo'>Estado: {data.categoria}</h1>
                    </>
                <div>
                    
                         
                    <button onClick={redirigir}>Volver</button> 

                </div>
                </>
                :<></>
                }
            </div>
            
            <hr></hr>
            <div className='encabezados-container'>
                <h1 className='titulo'>Fecha asignada: {historial && historial[0] ? fechaISOtoReadable(historial[0].fechaManual) : 'Sin estado'}</h1>
                <h1 className='titulo'>Ubicación: {historial && historial[0] ? historial[0].ubicacion : 'Sin ubicacion'}</h1>
                {
                    mostrarActualizarEstado ? <button onClick={actualizarEstado}>Cancelar</button> : 
                    user.permisos["Editar-Contenedores"] ?
                    <button onClick={actualizarEstado}>Agregar nuevo estado</button> : <></>
                }
            </div>
            
            <h3>Estados del contenedor:</h3>
                
           <div className='historial-form-container'>
           
            <table style={{width:'40%', background:'white',marginBottom:'20px'}}>
                
                <thead>
                <tr style={{width:'40%', background:'gray'}}>
                    <th>Estado</th>
                    <th>Ubicación</th>
                    <th>Fecha asignada</th> 
                    <th>Fecha de creacion</th>         
                </tr>
                </thead>
                <tbody>
                {/* Mostrar el estado actual primero con un estilo destacado */}
                {historial && historial.length > 0 && (
                    <tr style={{backgroundColor: '#e6f7ff', fontWeight: 'bold'}}>
                        <th>{historial[0].estado} (Actual)</th>
                        <th>{historial[0].ubicacion}</th>
                        <th>{fechaISOtoReadable(historial[0]?.fechaManual)}</th>
                        <th>{fechaISOtoReadable(historial[0].fechaHora)}</th>    
                    </tr>
                )}
                
                {/* Mostrar los estados anteriores */}
                {historial && historial.length > 1 ? 
                    historial.slice(1).map((item, index) => (
                        <tr key={index}>
                            <th>{item.estado}</th>
                            <th>{item.ubicacion}</th>
                            <th>{fechaISOtoReadable(item?.fechaManual)}</th>
                            <th>{fechaISOtoReadable(item.fechaHora)}</th>    
                        </tr>
                    ))
                    : null
                }
                
                {/* Mostrar el estado inicial "Contenedor Creado" al final */}
                <tr style={{backgroundColor: '#f5f5f5'}}>
                    <th>Contenedor Creado</th>
                    <th>-</th>
                    <th>{fechaCreacionOriginal ? fechaISOtoReadable(fechaCreacionOriginal) : '-'}</th>
                    <th>{fechaCreacionOriginal ? fechaISOtoReadable(fechaCreacionOriginal) : '-'}</th>
                </tr>
                </tbody>
            </table>
            {
                mostrarActualizarEstado && historial ? <ActualizarEstado
                    setHistorial={setHistorial} 
                    contenedor={id} 
                    actualizarEstado={actualizarEstado}
                    estad={ historial[0].estado}
                    ubicacio={ historial[0].ubicacion}

                    
                    /> : <></>
            }
            </div>
            <hr></hr>
            <div className='encabezados-container' >
                <h3>Productos:</h3>
                <div className="botones-productos">
                    {user.permisos["Editar-Contenedores"] && (
                        <>
                            <button onClick={toggleModoEdicionLotes} className={modoEdicionLotes ? "btn-cancelar" : "btn-editar"}>
                                {modoEdicionLotes ? "Cancelar edición" : "Editar productos"}
                            </button>
                            
                            {modoEdicionLotes && Object.keys(productosEditados).length > 0 && (
                                <button onClick={guardarCambiosLote} className="btn-guardar">
                                    Guardar cambios ({Object.keys(productosEditados).length})
                                </button>
                            )}
                            <button 
                                onClick={toggleCambioEstadoMasivo} 
                                className="btn-cambio-estado-masivo"
                            >
                                Enviar a Pedido
                            </button>
                        </>
                    )}
                    <button onClick={()=>setAgregarProducto(true)}> Agregar producto</button>
                </div>
            </div>
            <div className={`productos-lista ${modoEdicionLotes ? 'edicion-lotes-activa' : ''}`}>
            {
                productos ? productos.map((item)=> (
                    <Producto 
                        user={user} 
                        key={item.idContenedorProductos} 
                        producto={item} 
                        contenedor={id} 
                        onActualizar={actualizarProductoEnLista} 
                        setProducto={setProductos}
                        modoEdicionLotes={modoEdicionLotes}
                        registrarCambioProducto={registrarCambioProducto}
                    />
                )) : <></>
            }
            {
                agregarProducto ? <AgregarProducto contenedor={id} setAgregarProducto={setAgregarProducto } actualizarLista={setProductos}/> : <></>
            }
            {mostrarCambioEstadoMasivo && (
                <EnvioPedidoMasivo
                    isOpen={mostrarCambioEstadoMasivo}
                    onRequestClose={toggleCambioEstadoMasivo}
                    productos={productos}
                    contenedor={id}
                    onSuccess={handleCambioEstadoExitoso}
                />
            )}
            </div>
            <button onClick={openModal}>Ver historial de cambios</button>          
            <VerHistorial isOpen={isModalOpen} onRequestClose={closeModal} contenedor={id}></VerHistorial>  
           <hr></hr>
           <div className='encabezados-container'>
                <h2>Detalles</h2>
                {
                    user.permisos["Editar-Contenedores"] ?
                    <button onClick={actualizarDetalles}>{mostrarActualizarDetalles ? 'Cancelar': 'Editar detalles'}</button>: <></>}
            </div>
            
            {
                data ? 
                <>                <div className='detalles-container'>
                    <div>
                        <h3 className='titulo'>Proveedor: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.nombre}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Factura: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.factura}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Forwarder: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.forwarder ? data.forwarder : 'Sin forwarder'}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Comentario: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.comentario ? data.comentario : 'Sin comentarios'}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Sira: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.sira ? data.sira : 'Sin sira'}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Vep: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.vep ? data.vep : 'Sin vep'}</label>
                    </div>
                    <div>
                        <h3 className='titulo'>Codigo contenedor: </h3>
                        <label className={mostrarActualizarDetalles ? 'no-mostrar' : ''}>{data.codigoContenedor ? data.codigoContenedor : 'Sin codigo de contenedor'}</label>
                    </div>
                    
                </div>
                <div className='detalles-container'>
                    {
                        mostrarActualizarDetalles && data ? <ActualizarDetalles data={data} setData={setData} actualizarDetalles={actualizarDetalles}/> : <></>
                    }
                    
                </div>
                    
                </>:<></>
            }
            <hr></hr>
            { 
                user.permisos["Editar-Contenedores"] ?
                <ConfirmarEliminar id={id} tipo={'contenedor'}/> :<></>
            }
        </div>
    );
}   
export default ContendorDetalle; 