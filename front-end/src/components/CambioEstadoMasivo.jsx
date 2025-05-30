import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Modal.css';

function CambioEstadoMasivo({ isOpen, onRequestClose, productos, contenedor, onSuccess }) {
  const [comentario, setComentario] = useState('');
  const [destino, setDestino] = useState('');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estados, setEstados] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar ubicaciones y estados al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [ubicacionesRes, estadosRes] = await Promise.all([
          axios.get('http://localhost:5000/api/items/ubicaciones'),
          axios.get('http://localhost:5000/api/items/categorias')
        ]);
        setUbicaciones(ubicacionesRes.data);
        setEstados(estadosRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar ubicaciones y estados');
      }
    };

    if (isOpen) {
      cargarDatos();
      // Inicializar los productos seleccionados con la información necesaria
      const productosConCantidad = productos.map(producto => ({
        ...producto,
        cantidadAMover: 0, // Cantidad que se moverá al nuevo estado
        seleccionado: false // Indica si este producto está seleccionado
      }));
      setProductosSeleccionados(productosConCantidad);
    }
  }, [isOpen, productos]);

  // Actualizar la cantidad a mover de un producto específico
  const actualizarCantidad = (idProducto, cantidad) => {
    setProductosSeleccionados(prev => 
      prev.map(prod => 
        prod.idContenedorProductos === idProducto 
          ? { ...prod, cantidadAMover: cantidad, seleccionado: cantidad > 0 } 
          : prod
      )
    );
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que haya productos seleccionados
    const hayProductosSeleccionados = productosSeleccionados.some(p => p.seleccionado);
    if (!hayProductosSeleccionados) {
      setError('Debe seleccionar al menos un producto y especificar una cantidad');
      return;
    }
    
    // Validar que se haya ingresado un comentario
    if (!comentario.trim()) {
      setError('Debe ingresar un comentario');
      return;
    }
    
    // Validar que se haya seleccionado un destino
    if (!destino) {
      setError('Debe seleccionar un destino');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Filtrar solo los productos seleccionados y con cantidad mayor a 0
      const productosAMover = productosSeleccionados
        .filter(p => p.seleccionado && p.cantidadAMover > 0)
        .map(p => ({
          idContenedorProductos: p.idContenedorProductos,
          cantidadAMover: parseFloat(p.cantidadAMover),
          cantidadOriginal: parseFloat(p.cantidad),
          color: p.idColor,
          unidad: p.unidad,
          cantidadAlternativa: p.cantidadAlternativa,
          unidadAlternativa: p.unidadAlternativa,
          precioPorUnidad: p.precioPorUnidad,
          producto: p.producto,
          nombreProducto: p.nombre
        }));

      // Enviar la petición al servidor
      const response = await axios.post('http://localhost:5000/api/contenedorProducto/cambio-estado-masivo', {
        contenedor,
        destino,
        comentario,
        productos: productosAMover
      });

      console.log('Respuesta del servidor:', response.data);
      
      // Cerrar modal y notificar éxito
      onSuccess(response.data);
      onRequestClose();
    } catch (error) {
      console.error('Error al cambiar estado masivamente:', error);
      setError('Error al procesar el cambio de estado. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Cambio de Estado Masivo</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Selección de destino */}
          <div className="form-group">
            <label htmlFor="destino">Seleccionar Estado Destino:</label>
            <select 
              id="destino" 
              value={destino} 
              onChange={(e) => setDestino(e.target.value)}
              required
            >
              <option value="">Seleccione un estado</option>
              {estados.map((estado) => (
                <option key={estado.idCategoria} value={estado.nombreCategoria}>
                  {estado.nombreCategoria}
                </option>
              ))}
            </select>
          </div>
          
          {/* Tabla de productos */}
          <div className="productos-tabla-container">
            <table className="productos-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Color</th>
                  <th>Cantidad Disponible</th>
                  <th>Cantidad a Mover</th>
                </tr>
              </thead>
              <tbody>
                {productosSeleccionados.map((prod) => (
                  <tr key={prod.idContenedorProductos}>
                    <td>{prod.nombre}</td>
                    <td>{prod.color || 'Sin color'}</td>
                    <td>{prod.cantidad} {prod.unidad}</td>
                    <td>
                      <input 
                        type="number" 
                        min="0" 
                        max={prod.cantidad} 
                        step="0.01"
                        value={prod.cantidadAMover} 
                        onChange={(e) => actualizarCantidad(
                          prod.idContenedorProductos, 
                          Math.min(parseFloat(e.target.value) || 0, parseFloat(prod.cantidad))
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Campo de comentario */}
          <div className="form-group">
            <label htmlFor="comentario">Comentario (obligatorio):</label>
            <textarea 
              id="comentario" 
              value={comentario} 
              onChange={(e) => setComentario(e.target.value)} 
              required
              placeholder="Ingrese un comentario sobre este cambio de estado"
              rows="3"
            ></textarea>
          </div>
          
          {/* Botones */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onRequestClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Cambio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CambioEstadoMasivo;
