export const fechaISOtoReadable = (fecha) =>{
    if (!fecha) return '';

    let date = new Date(fecha);
    let options = { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric'
    };

    // Extraer horas, minutos y segundos
    let horas = date.getHours();
    let minutos = date.getMinutes();
    let segundos = date.getSeconds();

    // Si la hora no es 00:00:00, agregar el formato de hora
    if (horas !== 0 || minutos !== 0 || segundos !== 0) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false; // Formato 24h (cambiar a true para 12h)
    }

    return date.toLocaleDateString('es-ES', options);
}