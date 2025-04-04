import React,{useState, useEffect} from 'react';
import ReactModal from 'react-modal';
import axios from 'axios';
import { fechaISOtoReadable } from '../utils/fecha';
ReactModal.setAppElement('#root');

function VerHistorial({isOpen,onRequestClose,contenedor}){
    const [historial, setHistorial] = useState([]);
    useEffect(()=>{
        axios.get(`http://localhost:3000/api/historial/${contenedor}`).then((response)=>{
            setHistorial(response.data)
        })
    },[]);
    const defaultStyles = {
        content: {
          width: '50%',
          height: '50%',
          margin: 'auto',
          padding: '20px',
          borderRadius: '10px',
          border: 'none',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
          overflowY: 'auto', // Agregar scroll vertical
          minHeight: '70vh',
          maxHeight: '70vh',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      };
    return(
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel='Historial'
            style={defaultStyles}
        >   
            <div style={{display:'flex', justifyContent: 'space-between'}}>
                <h2>Historial de cambios en contendor {contenedor}</h2>
                <button onClick={onRequestClose}>Cerrar</button>
            </div>
            <hr></hr>
        {
            historial && historial.length > 0 ? 
                historial.map((item)=>(
                <div key={item.idHistorial}>
                    <p>fecha de cambio: {fechaISOtoReadable(item.fechaCambio)}</p>
                    <p>tipo cambio: {item.tipoCambio}</p>
                    <p>{item.cambios}</p>
                    <p>motivo: {item.motivo}</p>
                    <hr></hr>
                </div>))
            : null
        }
        </ReactModal>
    );
}

export default VerHistorial;