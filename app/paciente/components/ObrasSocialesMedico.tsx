import React from "react";

 interface ObraSocial {
  id_obra: number;
  descripcion: string;
  estado?: string;
  telefono_contacto?: number;
  sitio_web?: string;
  fecha_alta?: string;

}


interface ObrasSocialesMedicoProps {
  obrasSociales: ObraSocial[] | undefined;
  onObraSocialChange?: (obraSocial: string) => void;
}

const ObrasSocialesMedico = ({ obrasSociales, onObraSocialChange }: ObrasSocialesMedicoProps) => {
  const [selected, setSelected] = React.useState<string>("null");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
    if (onObraSocialChange) onObraSocialChange(e.target.value);
  };

  return (
    <>
      <label htmlFor="obrasSocialesMedico" className="block mb-1 font-medium">
        Obras Sociales del Médico:
      </label>
      <select
        id="obrasSocialesMedico"
        name="obrasSocialesMedico"
        className="w-full mb-2 p-2 border border-gray-300 rounded"
        value={selected}
        onChange={handleChange}
      >
        {obrasSociales && obrasSociales.length > 0 ? (
          <>
            {obrasSociales.map((obraSocial) => (
              <option key={obraSocial.id_obra} value={String(obraSocial.id_obra)}>
                {obraSocial.descripcion}
              </option>
            ))}
            <option value="null">Particular</option>
          </>
        ) : (
          <option value="null" >Particular</option>
        )}
      </select>
    </>
  );
};

export default ObrasSocialesMedico;
