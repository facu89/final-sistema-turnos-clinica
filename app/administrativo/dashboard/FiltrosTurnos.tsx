import React, { useState, useEffect } from "react";

interface Filters {
  medico?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface Medico {
  legajo_medico: string;
  nombre: string;
  apellido: string;
  dni_medico: string;
  matricula: string;
  telefono: string;
  tarifa: number;
  estado: string;
}

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  turnos: Array<{
    nombre_medico: string;
    apellido_medico: string;
  }>;
}

const FiltrosTurnos: React.FC<Props> = ({ filters, onChange, turnos }) => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Cargar TODOS los médicos registrados desde la API
  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/medico");
        if (!response.ok) {
          throw new Error("Error al obtener médicos");
        }
        const medicosData: Medico[] = await response.json();
        const medicosActivos = medicosData.filter(
          (medico) => medico.estado === "activo"
        );
        setMedicos(medicosActivos);

        console.log("Médicos cargados:", medicosActivos.length);
      } catch (error) {
        console.error("Error cargando médicos:", error);
        setMedicos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarMedicos();
  }, []);

  return (
    <>
      <p className="text-lg font-semibold mb-2">Filtrar por:</p>
      <div className="flex flex-row gap-6">
        <div>
          <label
            htmlFor="medico"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Médico
          </label>
          <select
            id="medico"
            name="medico"
            className="border rounded px-2 py-1 w-full"
            value={filters.medico || ""}
            onChange={(e) =>
              onChange({ ...filters, medico: e.target.value || undefined })
            }
            disabled={loading}
          >
            <option value="">
              {loading ? "Cargando médicos..." : "Todos los médicos"}
            </option>
            {medicos.map((medico) => {
              const nombreCompleto = `${medico.nombre} ${medico.apellido}`;
              return (
                <option key={medico.legajo_medico} value={nombreCompleto}>
                  Dr. {nombreCompleto} (Mat: {medico.matricula})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="fechaInicio"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha inicio
          </label>
          <input
            type="date"
            id="fechaInicio"
            name="fechaInicio"
            className="border rounded px-2 py-1 w-full"
            value={filters.fechaInicio || ""}
            onChange={(e) =>
              onChange({ ...filters, fechaInicio: e.target.value || undefined })
            }
          />
        </div>

        <div>
          <label
            htmlFor="fechaFin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha fin
          </label>
          <input
            type="date"
            id="fechaFin"
            name="fechaFin"
            className="border rounded px-2 py-1 w-full"
            value={filters.fechaFin || ""}
            onChange={(e) =>
              onChange({ ...filters, fechaFin: e.target.value || undefined })
            }
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={() => onChange({})}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </>
  );
};

export default FiltrosTurnos;
