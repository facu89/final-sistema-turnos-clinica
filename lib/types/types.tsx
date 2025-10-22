// Turno: cod_turno + dni_paciente + legajo_medico(fk) + id_pago(fk) + id_obra(fk) + fecha + hora  
// obraSocial: id_obra + descripcion + estado + fecha_cambio_estado  
// //
// PACIENTE =  dni_paciente + nombre + ape + telefono + email  
// MEDICO = legajo_medico + dni_medico + nombre + ape + direccion + telefono
// MEDICO_ESPECIALIDAD = legajo_medico + id_especialidad 
// ESPECIALIDAD =  id_especialidad + descripcion  
// ADMINISTRATIVO = legajo_administrativo + dni_administrativo + nombre + ape + direccion + telefono
// AGENDA = id_agenda + legajo_medico + legajo_administrativo 
// DIA_SEMANA = id_agenda + dia_semana+ hora_inicio + hora_fin
// PATOLOGIA =  cod_patologia + descripcion  
// LISTA_ESPERA = id_lista + legajo_medico + id_especialidad 
// PAGO = id_pago + forma_pago + monto + dia + hora  
// CONVENIO = legajo_medico + id_obra + fecha_alta  

// 
interface Paciente {
     nombre: string;
     dni: string;
     email: string;
     telefono: string;
     direccion: string;
}

interface Turno {
     fecha: Date;
     paciente: Paciente;
     medico: Medico;
     hora: string;
     duracion: string;
     motivo: string;
     observaciones?: string;
     estado: string;
}

interface Medico {
     nombre: string;
     especialidad: string;
     consultorio: string;
     legajo_medico: number;
}

// Tipamos las props del componente
interface InfoMedicoProps {
     turno: Turno;
}

interface TurnosPacientes{
     id: number;
     turnos: Turno[];
}