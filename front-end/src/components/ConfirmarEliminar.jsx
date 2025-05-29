import Swal from 'sweetalert2';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
function ConfirmarEliminar({id,tipo,actualizarLista,usuario,motivo,contenedor}){
    const [redireccionar, setRedireccionar] = useState(false);
    const handleDelete = async()=>{
        const result = await Swal.fire({
            title: '¿Estas seguro de eliminar?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor:'#d33',
            cancelButtonColor:'#3085d6',
            confirmButtonText:'Si, eliminar',
            cancelButtonText:'Cancelar'
        });
        if(result.isConfirmed){
            let ruta = '';
            if(tipo === 'contenedor'){
                ruta = 'contenedores'
            }
            if(tipo === 'ContenedorProducto'){
                ruta = 'ContenedorProducto'
            }
            if(tipo === 'producto'){
                ruta = 'producto'
            }
            try{
                console.log('Eliminando:', { tipo, id, motivo, contenedor });
                
                if(!motivo && !contenedor && (tipo === 'ContenedorProducto')){
                    throw new Error('Falta el encabezado X-Motivo.');
                };
                
                if (!id) {
                    throw new Error('ID no definido. No se puede eliminar el elemento.');
                }
                
                const response = await fetch(`http://localhost:5000/api/${ruta}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-usuario': usuario,
                        'x-motivo': motivo,
                        'x-contenedor': contenedor,
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al eliminar el elemento');
                }
                Swal.fire('Eliminado', 'El elemento ha sido eliminado.', 'success');
                
                // Ejecutar inmediatamente la función de actualización
                if (typeof actualizarLista === 'function') {
                    actualizarLista();
                }
                
                if(tipo==='contenedor' || tipo==='producto'){
                    setRedireccionar(true);
                }
            }catch(error){
                Swal.fire('Error', 'No se pudo eliminar el elemento'+error, 'error');
            }
            
        }
    }
    if(redireccionar){
        let ruta = '';
        if(tipo === 'contenedor'){
            ruta = '/ver-contenedores'
        }
        if(tipo === 'ContenedorProducto'){
            ruta = `/contenedor-detalle/${contenedor}`
        }
        if(tipo === 'producto'){
            ruta = '/ver-productos'
        }
        return <Navigate to={ruta} />
    }
    return <button onClick={handleDelete} className="btn-delete">Eliminar</button>;
}

export default ConfirmarEliminar;