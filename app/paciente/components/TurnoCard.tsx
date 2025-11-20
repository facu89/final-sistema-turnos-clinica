import { Button } from "@/components/ui/button";
import { useMedico } from "@/hooks/medico/useMedico";
import { CheckCircle } from "lucide-react";

export const TurnoCard = ({ turno }: { turno: any }) => {
const { medico, loading, error } = useMedico(turno.legajo_medico);
  return (
    <div className="p-4">
      <p className="text-sm font-medium">
        {loading
          ? "Cargando médico..."
          : medico
          ? `${medico.nombre} ${medico.apellido}`
          : `Médico ${turno.legajo_medico}`}
      </p>
      <p className="text-muted-foreground text-sm">{turno.fecha} - {turno.hora}</p>

    </div>
  );
};

