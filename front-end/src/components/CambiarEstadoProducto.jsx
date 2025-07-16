import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../UserProvider';
import { useNavigate } from 'react-router-dom';
import '../styles/CambiarEstadoProducto.css';

function CambiarEstadoProducto({ producto, onEstadoCambiado, onClose }) {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [destino, setDestino] = useState('nuevo_pedido'); // 'nuevo_pedido' o 'pedido_existente'
  const [pedidoExistente, setPedidoExistente] = useState('');
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [cantidadTransferir, setCantidadTransferir] = useState(producto.cantidad || 1);
  const [cantidadAlternativaTransferir, setCantidadAlternativaTransferir] = useState(producto.cantidadAlternativa || 0);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cargar los pedidos pendientes al iniciar
  useEffect(() => {
    // Obtener pedidos pendientes
    axios.get('http://gestion.lichy.local:5000/api/pedidos?estado=Pendiente')
      .then(response => {
        if (response.data && response.data.length > 0) {
          setPedidosPendientes(response.data);
        } else {
          console.log('No hay pedidos pendientes');
        }
      })
      .catch(error => {
        console.error('Error cargando pedidos pendientes:', error);
        setError('Error cargando pedidos pendientes. Intente de nuevo más tarde.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones para los datos del producto
      if (!cantidadTransferir || cantidadTransferir <= 0) {
        setError('Debe especificar una cantidad válida para transferir');
        setLoading(false);
        return;
      }
      
      if (cantidadTransferir > producto.cantidad) {
        setError('La cantidad a transferir no puede ser mayor que la cantidad disponible');
        setLoading(false);
        return;
      }
      
      // Validar cantidad alternativa si existe
      if (producto.cantidadAlternativa && cantidadAlternativaTransferir) {
        if (cantidadAlternativaTransferir < 0) {
          setError('La cantidad alternativa no puede ser negativa');
          setLoading(false);
          return;
        }
        
        if (cantidadAlternativaTransferir > producto.cantidadAlternativa) {
          setError('La cantidad alternativa a transferir no puede ser mayor que la cantidad alternativa disponible');
          setLoading(false);
          return;
        }
      }

      if (!motivo) {
        setError('Debe especificar un motivo para el cambio');
        setLoading(false);
        return;
      }

      let idPedido;
      
      // Determinar si crear un nuevo pedido o usar uno existente
      if (destino === 'nuevo_pedido') {
        // Crear un nuevo pedido
        const nuevoPedidoResponse = await axios.post('http://gestion.lichy.local:5000/api/pedidos', {
          usuarioCreacion: user.idUsuario,
          observaciones: `Pedido creado desde cambio de estado de producto: ${producto.nombre}`
        });
        
        idPedido = nuevoPedidoResponse.data.idPedido;
      } else {
        // Usar un pedido existente
        if (!pedidoExistente) {
          setError('Debe seleccionar un pedido existente');
          setLoading(false);
          return;
        }
        idPedido = pedidoExistente;
      }
      
      // Agregar el producto al pedido
      await axios.post(`http://gestion.lichy.local:5000/api/pedidos/${idPedido}/productos`, {
        idContenedorProducto: producto.idContenedorProductos,
        cantidadTransferir: cantidadTransferir,
        cantidadAlternativaTransferir: cantidadAlternativaTransferir || 0,
        ubicacionDestino: 'Pendiente', // Estado inicial pendiente, se asignará ubicación en el pedido
        usuarioCreacion: user.idUsuario,
        motivo: motivo,
        unidad: producto.unidad,
        unidadAlternativa: producto.unidadAlternativa || null,
        // Guardar información adicional para mostrar en la tabla de pedidos
        codigoInterno: producto.codigoInterno,
        color: producto.color,
        nombreProducto: producto.nombre
      });
      
      // Mostrar mensaje de éxito y cerrar el modal
      alert(`Producto agregado al Pedido #${idPedido}. Puede gestionar este pedido en la sección de Pedidos.`);
      
      if (onClose) {
        onClose();
      }
      
      // Redirigir al usuario a la página de detalles del pedido utilizando React Router
      navigate(`/pedido-detalle/${idPedido}`);
      
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      setError(error.response?.data || 'Error al procesar el pedido. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-body">
          <h2>Enviar Producto a Pedido</h2>
          
          <div className="producto-info">
            <h3>{producto.nombre}</h3>
            <p>Código: {producto.codigoInterno}</p>
            {producto.color && <p>Color: {producto.color}</p>}
            <p>
              Cantidad: {parseFloat(producto.cantidad).toFixed(2)} {producto.unidad}
              {producto.cantidadAlternativa > 0 && ` / ${parseFloat(producto.cantidadAlternativa).toFixed(2)} ${producto.unidadAlternativa}`}
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Destino del producto:</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="destino" 
                    value="nuevo_pedido" 
                    checked={destino === 'nuevo_pedido'} 
                    onChange={() => setDestino('nuevo_pedido')}
                  />
                  Crear nuevo pedido
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="destino" 
                    value="pedido_existente" 
                    checked={destino === 'pedido_existente'} 
                    onChange={() => setDestino('pedido_existente')}
                  />
                  Agregar a pedido existente
                </label>
              </div>
            </div>
            
            {destino === 'pedido_existente' && (
              <div className="form-group">
                <label>Seleccionar pedido:</label>
                <select 
                  value={pedidoExistente} 
                  onChange={(e) => setPedidoExistente(e.target.value)}
                  required={destino === 'pedido_existente'}
                >
                  <option value="">Seleccione un pedido</option>
                  {pedidosPendientes.length > 0 ? (
                    pedidosPendientes.map(pedido => (
                      <option key={pedido.idPedido} value={pedido.idPedido}>
                        Pedido #{pedido.idPedido} - {new Date(pedido.fechaCreacion).toLocaleDateString()}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay pedidos pendientes disponibles</option>
                  )}
                </select>
                {pedidosPendientes.length === 0 && (
                  <div className="info-message">
                    <p>No hay pedidos pendientes. Se creará uno nuevo.</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="form-group">
              <label>Cantidad a transferir:</label>
              <input 
                type="number" 
                value={cantidadTransferir} 
                onChange={(e) => setCantidadTransferir(Number(e.target.value))}
                min="0.01"
                max={producto.cantidad}
                step="0.01"
                required
              />
              <span className="input-info">
                Cantidad disponible: {parseFloat(producto.cantidad).toFixed(2)} {producto.unidad}
              </span>
            </div>
            
            {/* Campo para cantidad alternativa si el producto la tiene */}
            {producto.cantidadAlternativa > 0 && (
              <div className="form-group">
                <label>Cantidad alternativa a transferir ({producto.unidadAlternativa}):</label>
                <input 
                  type="number" 
                  value={cantidadAlternativaTransferir} 
                  onChange={(e) => setCantidadAlternativaTransferir(Number(e.target.value))}
                  min="0"
                  max={producto.cantidadAlternativa}
                  step="0.01"
                />
                <span className="input-info">
                  Cantidad alternativa disponible: {parseFloat(producto.cantidadAlternativa).toFixed(2)} {producto.unidadAlternativa}
                </span>
              </div>
            )}
            
            <div className="form-group">
              <label>Motivo:</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indique el motivo para agregar este producto al pedido"
                required
              />
            </div>
            
            <div className="info-message">
              <p><strong>Nota:</strong> Una vez agregado el producto al pedido, podrá distribuirlo a Mitre o Lichy desde la sección de Pedidos.</p>
            </div>
            
            <div className="buttons">
              <button type="button" onClick={onClose} disabled={loading}>Cancelar</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Procesando...' : 'Enviar a Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CambiarEstadoProducto;
