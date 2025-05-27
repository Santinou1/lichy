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
  
  // Estado para selección de contenedor al completar
  const [mostrarSeleccionContenedor, setMostrarSeleccionContenedor] = useState(false);
  const [contenedorDestino, setContenedorDestino] = useState('');
  
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
  
  // Marcar el pedido como completado con el contenedor seleccionado
  const completarPedido = async () => {
    if (!contenedorDestino) {
      setError('Debe seleccionar un contenedor destino');
      return;
    }
    
    try {
      // Llamada API con el contenedor destino
      await axios.put(`http://localhost:5000/api/pedidos/${id}/completar`, {
        usuarioModificacion: user.idUsuario,
        contenedorDestino: contenedorDestino
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
      
      {/* Modal de selección de contenedor */}
      {mostrarSeleccionContenedor && (
        <div className="seleccion-contenedor-modal">
          <div className="seleccion-contenedor-content">
            <h2>Seleccionar Contenedor Destino</h2>
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
            
            <div className="form-actions">
              <button 
                className="btn-submit"
                onClick={completarPedido}
                disabled={!contenedorDestino}
              >
                Confirmar y Completar Pedido
              </button>
              <button 
                className="btn-cancelar"
                onClick={() => setMostrarSeleccionContenedor(false)}
              >
                Cancelar
              </button>
            </div>
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
