import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../UserProvider';
import { useNavigate } from 'react-router-dom';
import '../styles/Modal.css';

function EnvioPedidoMasivo({ isOpen, onRequestClose, productos, contenedor, onSuccess }) {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [comentario, setComentario] = useState('Enviado desde contenedor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Inicializar los productos al abrir el modal
  useEffect(() => {

    // Inicializar los productos con cantidades a transferir
    if (isOpen && productos) {
      const productosConCantidad = productos
        .filter(p => p.cantidad > 0 && p.idColor) // Solo incluir productos con color asignado y cantidad > 0
        .map(producto => ({
          ...producto,
          cantidadTransferir: 0,
          cantidadAlternativaTransferir: 0,
          seleccionado: false
        }));
      setProductosSeleccionados(productosConCantidad);
    }
  }, [isOpen, productos]);

  // Actualizar la cantidad a transferir de un producto específico
  const actualizarCantidad = (idProducto, campo, valor) => {
    setProductosSeleccionados(prev => 
      prev.map(prod => {
        if (prod.idContenedorProductos === idProducto) {
          // Asegurarse de que la cantidad a transferir no supere la disponible
          let cantidadActualizada = parseFloat(valor);
          const esCantidadPrincipal = campo === 'cantidadTransferir';
          const cantidadMaxima = esCantidadPrincipal ? prod.cantidad : prod.cantidadAlternativa || 0;
          
          if (cantidadActualizada > cantidadMaxima) {
            cantidadActualizada = cantidadMaxima;
          }

          // Marcar como seleccionado si al menos una de las cantidades es mayor que 0
          const otroCampo = esCantidadPrincipal ? 'cantidadAlternativaTransferir' : 'cantidadTransferir';
          const seleccionado = cantidadActualizada > 0 || prod[otroCampo] > 0;
          
          return { 
            ...prod, 
            [campo]: cantidadActualizada,
            seleccionado: seleccionado
          };
        }
        return prod;
      })
    );
  };

  // Seleccionar o deseleccionar todos los productos
  const toggleSeleccionarTodos = (seleccionarTodos) => {
    setProductosSeleccionados(prev => 
      prev.map(prod => ({
        ...prod,
        cantidadTransferir: seleccionarTodos ? prod.cantidad : 0,
        cantidadAlternativaTransferir: seleccionarTodos ? (prod.cantidadAlternativa || 0) : 0,
        seleccionado: seleccionarTodos
      }))
    );
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setExito('');

    try {
      // Validar que haya productos seleccionados
      const hayProductosSeleccionados = productosSeleccionados.some(p => p.seleccionado);
      if (!hayProductosSeleccionados) {
        setError('Debe seleccionar al menos un producto y especificar una cantidad');
        setLoading(false);
        return;
      }

      // Crear un nuevo pedido automáticamente
      const nuevoPedidoResponse = await axios.post('http://gestion.lichy.local:5000/api/pedidos', {
        usuarioCreacion: user.idUsuario,
        observaciones: comentario || `Productos enviados desde contenedor #${contenedor}`
      });
      
      const idPedido = nuevoPedidoResponse.data.idPedido;

      // Agregar los productos seleccionados al pedido
      const productosParaAgregar = productosSeleccionados
        .filter(p => p.seleccionado)
        .map(p => ({
          idContenedorProducto: p.idContenedorProductos,
          cantidadTransferir: parseFloat(p.cantidadTransferir),
          cantidadAlternativaTransferir: parseFloat(p.cantidadAlternativaTransferir || 0),
          motivo: comentario,
          // El valor predeterminado 'Pedido' se usará en el backend
          colorId: p.idColor,
          nombreProducto: p.nombre,
          unidad: p.unidad,
          unidadAlternativa: p.unidadAlternativa || '',
          usuarioCreacion: user.idUsuario // Asegurarse de incluir el ID del usuario
        }));

      const resultados = await Promise.all(
        productosParaAgregar.map(producto =>
          axios.post(`http://gestion.lichy.local:5000/api/pedidos/${idPedido}/productos`, producto)
        )
      );

      setExito(`Los productos se han agregado exitosamente al pedido #${idPedido}`);
      
      // Notificar al componente padre del éxito
      if (onSuccess) {
        onSuccess({
          mensaje: `${productosParaAgregar.length} productos transferidos al pedido #${idPedido}`,
          idPedido: idPedido
        });
      }

      // Opcional: redirigir a la página de detalle del pedido después de un breve retraso
      setTimeout(() => {
        onRequestClose();
        navigate(`/pedido-detalle/${idPedido}`);
      }, 2000);

    } catch (error) {
      console.error('Error al transferir productos al pedido:', error);
      setError('Error al procesar la transferencia de productos. Revise la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>Enviar Productos a Pedido</h2>
        
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        {exito && <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>{exito}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="info-message" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p>Se creará un nuevo pedido con los productos seleccionados.</p>
          </div>
          
          {/* Campo de comentario */}
          <div className="form-group">
            <label htmlFor="comentario">Comentario/Motivo:</label>
            <textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Ingrese un comentario o motivo para este pedido"
              required
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            ></textarea>
          </div>
          
          {/* Botones para seleccionar/deseleccionar todos */}
          <div className="seleccion-masiva" style={{ marginBottom: '15px' }}>
            <button 
              type="button" 
              onClick={() => toggleSeleccionarTodos(true)}
              className="btn-secundario"
              style={{ marginRight: '10px' }}
            >
              Seleccionar Todos
            </button>
            <button 
              type="button" 
              onClick={() => toggleSeleccionarTodos(false)}
              className="btn-secundario"
            >
              Deseleccionar Todos
            </button>
          </div>
          
          {/* Tabla de productos para seleccionar */}
          <div className="productos-tabla-container" style={{ marginBottom: '20px' }}>
            <table className="productos-tabla" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Color</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Disponible</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Cantidad a Transferir</th>
                  {productosSeleccionados.some(p => p.cantidadAlternativa > 0) && (
                    <>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Disponible Alt.</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Cant. Alt. a Transferir</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {productosSeleccionados.length > 0 ? (
                  productosSeleccionados.map((producto) => (
                    <tr key={producto.idContenedorProductos} style={{ 
                      backgroundColor: producto.seleccionado ? '#e6f7ff' : 'transparent',
                      border: '1px solid #ddd'
                    }}>
                      <td style={{ padding: '8px' }}>{producto.nombre}</td>
                      <td style={{ padding: '8px' }}>{producto.color || 'Sin color'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {parseFloat(producto.cantidad).toFixed(2)} {producto.unidad}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          max={producto.cantidad}
                          value={producto.cantidadTransferir}
                          onChange={(e) => actualizarCantidad(
                            producto.idContenedorProductos, 
                            'cantidadTransferir', 
                            e.target.value
                          )}
                          style={{ width: '80px', textAlign: 'right' }}
                        />
                        <span style={{ marginLeft: '5px' }}>{producto.unidad}</span>
                      </td>
                      
                      {productosSeleccionados.some(p => p.cantidadAlternativa > 0) && (
                        <>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {producto.cantidadAlternativa 
                              ? `${parseFloat(producto.cantidadAlternativa).toFixed(2)} ${producto.unidadAlternativa}`
                              : '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {producto.cantidadAlternativa ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  max={producto.cantidadAlternativa}
                                  value={producto.cantidadAlternativaTransferir}
                                  onChange={(e) => actualizarCantidad(
                                    producto.idContenedorProductos, 
                                    'cantidadAlternativaTransferir', 
                                    e.target.value
                                  )}
                                  style={{ width: '80px', textAlign: 'right' }}
                                />
                                <span style={{ marginLeft: '5px' }}>{producto.unidadAlternativa}</span>
                              </>
                            ) : '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '15px' }}>
                      No hay productos disponibles para transferir
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Botones de acción */}
          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button 
              type="button" 
              onClick={onRequestClose}
              className="btn-cancelar"
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-principal"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Enviar a Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnvioPedidoMasivo;
