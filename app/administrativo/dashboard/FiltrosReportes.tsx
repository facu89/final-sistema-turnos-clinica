import React from "react";

interface FiltrosReportesProps {
  fechaInicio: string;
  setFechaInicio: (v: string) => void;
  fechaFin: string;
  setFechaFin: (v: string) => void;
  especialidadSeleccionada?: string;
  setEspecialidadSeleccionada?: (v: string) => void;
  especialidades?: { id_especialidad: number; descripcion: string }[];
  medicoSeleccionado?: string;
  setMedicoSeleccionado?: (v: string) => void;
  medicos?: {
    legajo_medico: string;
    nombre: string;
    apellido: string;
    especialidad?: string;
  }[];
  loading?: boolean;
  mostrarEspecialidad?: boolean;
  mostrarMedico?: boolean;
  children?: React.ReactNode;
}

export const FiltrosReportes: React.FC<FiltrosReportesProps> = ({
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  especialidades = [],
  medicoSeleccionado,
  setMedicoSeleccionado,
  medicos = [],
  loading = false,
  mostrarEspecialidad = true,
  mostrarMedico = true,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div>
      <label className="text-sm font-medium">Fecha Inicio</label>
      <input
        type="date"
        className="w-full mt-1 p-2 border rounded-lg"
        value={fechaInicio}
        onChange={(e) => setFechaInicio(e.target.value)}
      />
    </div>
    <div>
      <label className="text-sm font-medium">Fecha Fin</label>
      <input
        type="date"
        className="w-full mt-1 p-2 border rounded-lg"
        value={fechaFin}
        onChange={(e) => setFechaFin(e.target.value)}
      />
    </div>
    {mostrarMedico && setMedicoSeleccionado && (
      <div>
        <label className="text-sm font-medium">Médico</label>
        <select
          className="w-full mt-1 p-2 border rounded-lg"
          value={medicoSeleccionado}
          onChange={(e) => setMedicoSeleccionado(e.target.value)}
          disabled={loading}
        >
          <option value="">
            {loading ? "Cargando médicos..." : "Todos los médicos"}
          </option>
          {medicos.map((medico) => (
            <option
              key={medico.legajo_medico}
              value={`${medico.nombre} ${medico.apellido}`}
            >
              Dr. {medico.nombre} {medico.apellido}
              {medico.especialidad && ` - ${medico.especialidad}`}
            </option>
          ))}
        </select>
      </div>
    )}
    {mostrarEspecialidad && setEspecialidadSeleccionada && (
      <div>
        <label className="text-sm font-medium">Especialidad</label>
        <select
          className="w-full mt-1 p-2 border rounded-lg"
          value={especialidadSeleccionada}
          onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
          disabled={loading}
        >
          <option value="">
            {loading
              ? "Cargando especialidades..."
              : "Todas las especialidades"}
          </option>
          {especialidades.map((especialidad) => (
            <option
              key={especialidad.id_especialidad}
              value={String(especialidad.id_especialidad)}
            >
              {especialidad.descripcion}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);
