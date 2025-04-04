import '../styles/NoItems.css';
function NoItems({nombre}){
    return (
        <div className='no-items-container'>
            <h2 className='no-items-titulo'>No se encontraron {nombre}.</h2>
        </div>
    )
}
export default NoItems;