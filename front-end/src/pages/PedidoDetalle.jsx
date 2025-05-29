import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/PedidoDetalle.css';
import { useUserContext } from '../UserProvider';

function PedidoDetalle() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUserContext();
  const navigate = useNavigate();
  
  // Estados para agregar productos
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadTransferir, setCantidadTransferir] = useState(0);
  const [cantidadAlternativaTransferir, setCantidadAlternativaTransferir] = useState(0);
  const [ubicacionDestino, setUbicacionDestino] = useState('');
  
  // Estados para completar pedido
  const [mostrarSeleccionContenedor, setMostrarSeleccionContenedor] = useState(false);
  const [contenedorDestino, setContenedorDestino] = useState('');
  const [comentarioCompletado, setComentarioCompletado] = useState('');
  const [productosEditados, setProductosEditados] = useState([]);
  const [editandoCantidades, setEditandoCantidades] = useState(false);
  
  // Estado para filtrar productos
  const [filtroCodigoInterno, setFiltroCodigoInterno] = useState('');
  const [filtroColor, setFiltroColor] = useState('');

  useEffect(() => {
    cargarDatosPedido();
    cargarProductosDisponibles();
  }, [id]);

  const cargarDatosPedido = async () => {
    try {
      setLoading(true);
      // Esta llamada API necesitará implementarse en el backend
      const response = await axios.get(`http://localhost:5000/api/pedidos/${id}`);
      setPedido(response.data);
      
      // Cargar productos asociados al pedido
      const productosResponse = await axios.get(`http://localhost:5000/api/pedidos/${id}/productos`);
      setProductos(productosResponse.data);
      
      setError('');
    } catch (error) {
      console.error('Error al cargar los datos del pedido:', error);
      setError('Error al cargar los datos del pedido. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductosDisponibles = async () => {
    try {
      // Esta llamada API necesitará implementarse en el backend
      // Obtiene productos disponibles para transferir
      const response = await axios.get('http://localhost:5000/api/contenedorProducto/disponibles');
      setProductosDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar productos disponibles:', error);
    }
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    
    if (!productoSeleccionado) {
      setError('Debe seleccionar un producto');
      return;
    }
    
    if (!cantidadTransferir || cantidadTransferir <= 0) {
      setError('Debe especificar una cantidad válida para transferir');
      return;
    }
    
    if (!ubicacionDestino) {
      setError('Debe seleccionar una ubicación destino');
      return;
    }
    
    // Encontrar el producto seleccionado para validar cantidad
    const producto = productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado));
    
    if (cantidadTransferir > producto.cantidad) {
      setError('La cantidad a transferir no puede ser mayor que la cantidad disponible');
      return;
    }
    
    // Validar cantidad alternativa si existe
    if (producto.cantidadAlternativa && cantidadAlternativaTransferir) {
      if (cantidadAlternativaTransferir < 0) {
        setError('La cantidad alternativa no puede ser negativa');
        return;
      }
      
      if (cantidadAlternativaTransferir > producto.cantidadAlternativa) {
        setError('La cantidad alternativa a transferir no puede ser mayor que la disponible');
        return;
      }
    }
    
    try {
      // Esta llamada API necesitará implementarse en el backend
      await axios.post(`http://localhost:5000/api/pedidos/${id}/productos`, {
        idContenedorProducto: productoSeleccionado,
        cantidadTransferir: cantidadTransferir,
        cantidadAlternativaTransferir: cantidadAlternativaTransferir,
        ubicacionDestino: ubicacionDestino,
        usuarioCreacion: user.idUsuario
      });
      
      // Limpiar formulario
      setProductoSeleccionado('');
      setCantidadTransferir(0);
      setCantidadAlternativaTransferir(0);
      setUbicacionDestino('');
      setMostrarFormulario(false);
      
      // Recargar datos del pedido
      cargarDatosPedido();
      cargarProductosDisponibles();
    } catch (error) {
      console.error('Error al agregar producto al pedido:', error);
      setError('Error al agregar producto al pedido. Por favor, intente de nuevo.');
    }
  };

  const eliminarProducto = async (idProductoPedido) => {
    if (!confirm('¿Está seguro de eliminar este producto del pedido?')) {
      return;
    }
    
    try {
      // Esta llamada API necesitará implementarse en el backend
      await axios.delete(`http://localhost:5000/api/pedidos/${id}/productos/${idProductoPedido}`);
      
      // Recargar datos del pedido
      cargarDatosPedido();
    } catch (error) {
      console.error('Error al eliminar producto del pedido:', error);
      setError('Error al eliminar producto del pedido. Por favor, intente de nuevo.');
    }
  };
  
  // Filtra productos disponibles según los criterios de búsqueda
  const productosFiltrados = productosDisponibles.filter(producto => {
    const coincideCodigoInterno = !filtroCodigoInterno || 
      (producto.codigoInterno && producto.codigoInterno.toLowerCase().includes(filtroCodigoInterno.toLowerCase()));
    
    const coincideColor = !filtroColor || 
      (producto.color && producto.color.toLowerCase().includes(filtroColor.toLowerCase()));
    
    return coincideCodigoInterno && coincideColor;
  });

  // Iniciar proceso de completar pedido mostrando selección de contenedor
  const iniciarCompletarPedido = () => {
    if (productos.length === 0) {
      setError('No puede completar un pedido sin productos');
      return;
    }
    
    if (!confirm('¿Está seguro de marcar este pedido como completado? Esta acción transferirá todos los productos a sus ubicaciones designadas.')) {
      return;
    }
    
    setMostrarSeleccionContenedor(true);
  };
  
  // Inicializar productos editados con los valores actuales cuando se abra el modal
  useEffect(() => {
    if (mostrarSeleccionContenedor && productos.length > 0 && productosEditados.length === 0) {
      const productosIniciales = productos.map(producto => ({
        idProductoPedido: producto.idProductoPedido,
        cantidad: parseFloat(producto.cantidad),
        cantidadAlternativa: producto.cantidadAlternativa ? parseFloat(producto.cantidadAlternativa) : null,
        confirmado: false
      }));
      setProductosEditados(productosIniciales);
    }
  }, [mostrarSeleccionContenedor, productos]);

  // Función para actualizar las cantidades de un producto en el array de productosEditados
  const actualizarCantidadProducto = (idProductoPedido, campo, valor) => {
    const nuevosProductos = productosEditados.map(producto => {
      if (producto.idProductoPedido === idProductoPedido) {
        return { ...producto, [campo]: valor };
      }
      return producto;
    });
    setProductosEditados(nuevosProductos);
  };

  // Función para confirmar un producto
  const confirmarProducto = (idProductoPedido) => {
    const nuevosProductos = productosEditados.map(producto => {
      if (producto.idProductoPedido === idProductoPedido) {
        return { ...producto, confirmado: true };
      }
      return producto;
    });
    setProductosEditados(nuevosProductos);
  };

  // Validar si todos los productos están confirmados
  const todosProductosConfirmados = () => {
    return productosEditados.every(producto => producto.confirmado);
  };

  // Marcar el pedido como completado con el contenedor seleccionado y el comentario
  const completarPedido = async () => {
    if (!contenedorDestino) {
      setError('Debe seleccionar un contenedor destino');
      return;
    }

    if (!comentarioCompletado.trim()) {
      setError('Debe ingresar un comentario');
      return;
    }

    if (!todosProductosConfirmados()) {
      setError('Debe confirmar todas las cantidades antes de completar el pedido');
      return;
    }
    
    try {
      // Llamada API con el contenedor destino, comentario y productos editados
      await axios.put(`http://localhost:5000/api/pedidos/${id}/completar`, {
        usuarioModificacion: user.idUsuario,
        contenedorDestino: contenedorDestino,
        comentario: comentarioCompletado,
        productosEditados: productosEditados
      });
      
      // Redirigir a la lista de pedidos
      navigate('/pedidos');
    } catch (error) {
      console.error('Error al completar el pedido:', error);
      setError('Error al completar el pedido. Por favor, intente de nuevo.');
    }
  };

  if (loading && !pedido) {
    return <div className="loading">Cargando datos del pedido...</div>;
  }

  return (
    <div className="pedido-detalle-container">
      <h1>Pedido #{id}</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {pedido && (
        <div className="pedido-info">
          <div className="info-row">
            <span className="label">Estado:</span>
            <span className="value">{pedido.estado}</span>
          </div>
          <div className="info-row">
            <span className="label">Fecha de Creación:</span>
            <span className="value">{new Date(pedido.fechaCreacion).toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="label">Creado por:</span>
            <span className="value">{pedido.nombreUsuario}</span>
          </div>
          {pedido.fechaCompletado && (
            <>
              <div className="info-row">
                <span className="label">Fecha de Completado:</span>
                <span className="value">{new Date(pedido.fechaCompletado).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="label">Completado por:</span>
                <span className="value">{pedido.nombreUsuarioCompletado}</span>
              </div>
            </>
          )}
          {pedido.observaciones && (
            <div className="info-row">
              <span className="label">Observaciones:</span>
              <span className="value">{pedido.observaciones}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="pedido-actions">
        {pedido && pedido.estado === 'Pendiente' && !mostrarFormulario && !mostrarSeleccionContenedor && (
          <button className="btn-agregar-producto" onClick={() => setMostrarFormulario(true)}>
            Agregar Producto
          </button>
        )}
        
        {pedido && pedido.estado === 'Pendiente' && !mostrarSeleccionContenedor && (
          <div className="pedido-acciones">
            <button 
              className="btn-completar-pedido" 
              onClick={iniciarCompletarPedido}
              disabled={productos.length === 0}
            >
              Completar Pedido
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de completar pedido */}
      {mostrarSeleccionContenedor && (
        <div className="seleccion-contenedor-modal">
          <div className="seleccion-contenedor-content">
            <h2>Completar Pedido</h2>
            
            {!editandoCantidades ? (
              <>
                <p>Elija el contenedor predeterminado para los productos:</p>
                
                <div className="form-group">
                  <label>Contenedor Destino:</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="contenedorDestino" 
                        value="1" // ID del contenedor Mitre
                        checked={contenedorDestino === '1'}
                        onChange={() => setContenedorDestino('1')}
                      />
                      Mitre
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="contenedorDestino" 
                        value="2" // ID del contenedor Lichy
                        checked={contenedorDestino === '2'}
                        onChange={() => setContenedorDestino('2')}
                      />
                      Lichy
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Comentario: <span className="campo-requerido">*</span></label>
                  <textarea 
                    value={comentarioCompletado}
                    onChange={(e) => setComentarioCompletado(e.target.value)}
                    placeholder="Ingrese un comentario sobre este pedido..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-editar-cantidades"
                    onClick={() => setEditandoCantidades(true)}
                  >
                    Revisar y Editar Cantidades
                  </button>
                  <button 
                    className="btn-cancelar"
                    onClick={() => setMostrarSeleccionContenedor(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Confirme las cantidades de los productos:</p>
                
                <div className="productos-confirmacion">
                  <table className="productos-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Color</th>
                        <th>Cantidad</th>
                        <th>Cantidad Alt.</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map(producto => {
                        const productoEditado = productosEditados.find(p => p.idProductoPedido === producto.idProductoPedido);
                        return (
                          <tr key={producto.idProductoPedido} className={productoEditado?.confirmado ? 'producto-confirmado' : ''}>
                            <td>{producto.nombreProducto}</td>
                            <td>{producto.codigoInterno || 'Sin código'}</td>
                            <td>{producto.color || 'Sin color'}</td>
                            <td>
                              <input 
                                type="number" 
                                value={productoEditado?.cantidad || producto.cantidad} 
                                onChange={(e) => actualizarCantidadProducto(producto.idProductoPedido, 'cantidad', Number(e.target.value))}
                                step="0.01"
                                min="0.01"
                                disabled={productoEditado?.confirmado}
                              />
                              {producto.unidad}
                            </td>
                            <td>
                              {producto.cantidadAlternativa ? (
                                <>
                                  <input 
                                    type="number" 
                                    value={productoEditado?.cantidadAlternativa || producto.cantidadAlternativa} 
                                    onChange={(e) => actualizarCantidadProducto(producto.idProductoPedido, 'cantidadAlternativa', Number(e.target.value))}
                                    step="0.01"
                                    min="0"
                                    disabled={productoEditado?.confirmado}
                                  />
                                  {producto.unidadAlternativa}
                                </>
                              ) : '-'}
                            </td>
                            <td>
                              {!productoEditado?.confirmado ? (
                                <button 
                                  className="btn-confirmar"
                                  onClick={() => confirmarProducto(producto.idProductoPedido)}
                                >
                                  Confirmar
                                </button>
                              ) : (
                                <span className="texto-confirmado">Confirmado</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-submit"
                    onClick={completarPedido}
                    disabled={!contenedorDestino || !comentarioCompletado.trim() || !todosProductosConfirmados()}
                  >
                    Confirmar y Completar Pedido
                  </button>
                  <button 
                    className="btn-volver"
                    onClick={() => setEditandoCantidades(false)}
                  >
                    Volver
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {mostrarFormulario && (
        <div className="formulario-agregar-producto">
          <h2>Agregar Producto al Pedido</h2>
          
          <div className="filtros-productos">
            <div className="form-group">
              <label>Filtrar por Código Interno:</label>
              <input 
                type="text" 
                value={filtroCodigoInterno} 
                onChange={(e) => setFiltroCodigoInterno(e.target.value)}
                placeholder="Ingrese código interno"
              />
            </div>
            
            <div className="form-group">
              <label>Filtrar por Color:</label>
              <input 
                type="text" 
                value={filtroColor} 
                onChange={(e) => setFiltroColor(e.target.value)}
                placeholder="Ingrese color"
              />
            </div>
          </div>
          
          <form onSubmit={handleAgregarProducto}>
            <div className="form-group">
              <label>Producto:</label>
              <select 
                value={productoSeleccionado} 
                onChange={(e) => {
                  setProductoSeleccionado(e.target.value);
                  setCantidadTransferir(0);
                  setCantidadAlternativaTransferir(0);
                }}
                required
              >
                <option value="">Seleccione un producto</option>
                {productosFiltrados.map(producto => (
                  <option key={producto.idContenedorProductos} value={producto.idContenedorProductos}>
                    {producto.codigoInterno} - {producto.nombreProducto} - {producto.color || 'Sin color'} - Disponible: {parseFloat(producto.cantidad).toFixed(2)} {producto.unidad}
                  </option>
                ))}
              </select>
            </div>
            
            {productoSeleccionado && (
              <>
                <div className="form-group">
                  <label>Cantidad ({productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado))?.unidad}):</label>
                  <input 
                    type="number" 
                    value={cantidadTransferir} 
                    onChange={(e) => setCantidadTransferir(Number(e.target.value))}
                    min="0.01"
                    max={productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado))?.cantidad}
                    step="0.01"
                    required
                  />
                </div>
                
                {/* Mostrar campo de cantidad alternativa solo si el producto tiene */}
                {productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado))?.cantidadAlternativa > 0 && (
                  <div className="form-group">
                    <label>Cantidad Alternativa ({productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado))?.unidadAlternativa}):</label>
                    <input 
                      type="number" 
                      value={cantidadAlternativaTransferir} 
                      onChange={(e) => setCantidadAlternativaTransferir(Number(e.target.value))}
                      min="0"
                      max={productosDisponibles.find(p => p.idContenedorProductos === parseInt(productoSeleccionado))?.cantidadAlternativa}
                      step="0.01"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Ubicación Destino:</label>
                  <select 
                    value={ubicacionDestino} 
                    onChange={(e) => setUbicacionDestino(e.target.value)}
                    required
                  >
                    <option value="">Seleccione una ubicación</option>
                    <option value="Mitre">Mitre</option>
                    <option value="Lichy">Lichy</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="form-actions">
              <button type="submit" className="btn-submit">Agregar al Pedido</button>
              <button type="button" className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      
      <div className="productos-pedido">
        <h2>Productos en el Pedido</h2>
        
        {productos.length > 0 ? (
          <table className="productos-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código Interno</th>
                <th>Color</th>
                <th>Cantidad</th>
                <th>Cantidad Alt.</th>
                <th>Ubicación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(producto => (
                <tr key={producto.idProductoPedido}>
                  <td>
                    {/* Información compacta del producto */}
                    <div className="producto-info-compacta">
                      {producto.nombreProducto}
                    </div>
                  </td>
                  <td>{producto.codigoInterno || 'Sin código'}</td>
                  <td>{producto.color || 'Sin color'}</td>
                  <td>{parseFloat(producto.cantidad).toFixed(2)} {producto.unidad}</td>
                  <td>
                    {producto.cantidadAlternativa 
                      ? `${parseFloat(producto.cantidadAlternativa).toFixed(2)} ${producto.unidadAlternativa}` 
                      : '-'}
                  </td>
                  <td>{producto.ubicacionDestino}</td>
                  <td>
                    {pedido && pedido.estado === 'Pendiente' && (
                      <button 
                        className="btn-eliminar"
                        onClick={() => eliminarProducto(producto.idProductoPedido)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-productos">
            No hay productos en este pedido. Agregue productos usando el botón "Agregar Producto".
          </div>
        )}
      </div>
    </div>
  );
}

export default PedidoDetalle;
