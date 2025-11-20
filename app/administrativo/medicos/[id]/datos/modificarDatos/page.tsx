"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EditarInformacionMedico from "../EditarInformacionMedico";

interface DatosEditables {
	nombre: string;
	apellido: string;
	dni_medico: string;
	telefono: string;
	matricula: string;
	especialidades?: string[];
    tarifa: number;
    // convenios / obras sociales asignadas (ids)
    convenios?: string[];
}

export default function Page() {
	const params = useParams();
	const legajo = params?.id as string;

	const [datos, setDatos] = useState<DatosEditables | null>(null);
	const [datosTemp, setDatosTemp] = useState<DatosEditables | null>(null);
	const [editando, setEditando] = useState(true);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!legajo) return;

		const fetchMedico = async () => {
			setLoading(true);
			try {
				const res = await fetch(`/api/medico/${legajo}?`,{
					cache: "no-store",
				});
				if (!res.ok) {
					console.error("Error al obtener médico");
					setDatos(null);
					setDatosTemp(null);
					setLoading(false);
					return;
				}
				console.log(res)

				const medico = await res.json();
				const parsed: DatosEditables = {
					nombre: medico.nombre || "",
					apellido: medico.apellido || "",
					dni_medico: String(medico.dni_medico || ""),
					telefono: medico.telefono || "",
					matricula: medico.matricula || "",
					tarifa: medico.tarifa || "",
				};
				console.log(parsed);

				setDatos(parsed);
				setDatosTemp(parsed);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchMedico();
	}, [legajo]);

	if (loading) {
		return <div className="p-4">Cargando información del médico...</div>;
	}

	
	if (!datos || !datosTemp) {
		return (
			<div className="p-4">
				<p className="text-red-600">No se pudo cargar la información del médico. Verificá el legajo.</p>
			</div>
		);
	}

	// Datos por defecto (ya cargados)
	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">Modificar datos del médico</h1>
			<EditarInformacionMedico
				legajo_medico={legajo}
				datos={datos}
				datosTemp={datosTemp}
				setDatosTemp={setDatosTemp as React.Dispatch<React.SetStateAction<DatosEditables>>}
				setDatos={setDatos as React.Dispatch<React.SetStateAction<DatosEditables>>}
				setEditando={setEditando}
				onGuardar={(nuevos) => {
					console.log("Guardado en page.tsx", nuevos);
				}}
			/>
		</div>
	);
}
