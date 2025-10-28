"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

interface EditarInformacionProps {
    legajo_medico: string;
    datos: DatosEditables;
    setDatos: React.Dispatch<React.SetStateAction<DatosEditables>>;
    datosTemp: DatosEditables;
    setDatosTemp: React.Dispatch<React.SetStateAction<DatosEditables>>;
    setEditando: React.Dispatch<React.SetStateAction<boolean>>;
    onGuardar?: (nuevosDatos: DatosEditables) => void; 
}

interface Especialidad {
    id_especialidad: string;
    descripcion: string;
}

// Helpers para parsear y construir matrícula
function parseMatricula(raw: string | undefined | null) {
    const s = String(raw || "").trim().toUpperCase();
    if (!s) return { prefijo: "", numeroMat: "" };
    const match = s.match(/^([A-Z]{2})(\d+)$/);
    if (match) return { prefijo: match[1], numeroMat: match[2] };
    // si no hay prefijo de 2 letras, extraer dígitos
    const digits = s.replace(/\D/g, "");
    return { prefijo: "", numeroMat: digits };
}

function buildMatricula(prefijo: string, numeroMat: string) {
    const p = (prefijo || "").trim().toUpperCase();
    const n = (numeroMat || "").trim();
    if (!p) return n;
    return `${p}${n}`;
}

async function guardarDatosEnBD(nuevosDatos: DatosEditables, legajo_medico: string) {
    console.log ("nuevos datos de medico", nuevosDatos);
    console.log ("legajo de medico", legajo_medico);
    try {
        // NOTE: enviar a la ruta REST correcta.
        const response = await fetch("/api/medico", {
            method: "PUT",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ ...nuevosDatos, legajo_medico})
        });

        if (!response.ok) {
            console.error("Error guardando datos generales del médico", await response.text());
            return false;
        }

        // PUT /api/medico ahora también sincroniza las especialidades en el servidor,
        // por lo que con una sola llamada alcanza (reduce tráfico y evita duplicación).
        return true;
    }
    catch (error) {
        return false;
    }
}
const modificarDatosMedico: React.FC<EditarInformacionProps> = ({
    legajo_medico,
    datos,
    setDatos,
    datosTemp,
    setDatosTemp,
    setEditando,
    onGuardar,
}) => {
    const [tipoMatricula, setTipoMatricula] = useState<string>("");
    const [numeroMatricula, setNumeroMatricula] = useState<string>("");
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([]);
    const [isLoadingEspecialidades, setIsLoadingEspecialidades] = useState(true);
    const [obrasSociales, setObrasSociales] = useState<{ id_obra: string; descripcion: string }[]>([]);
    const [obrasSocialesSeleccionadas, setObrasSocialesSeleccionadas] = useState<string[]>([]);
    const [isLoadingObras, setIsLoadingObras] = useState(true);
    const [error, setError] = useState <string | null>(null);
    const [exito, setExito] = useState(false); //esto tiene que ir en la parte del handle submit
    const [isLoading, setIsLoading] = useState(false); // en el submit y el cancel
    const router = useRouter();

    useEffect(() => {
        const cargar = async () => {
            setIsLoadingEspecialidades(true);
            try {
                // todas las especialidades
                const resTODAS = await fetch("/api/especialidades");
                const listaEspecialidades: Especialidad[] = await resTODAS.json();

                // especialidades asignadas al médico
                const resEspecialidadesAsignadas = await fetch(
                    `/api/medico/medico-especialidad?legajo_medico=${legajo_medico}`
                );
                let EspecialidadesAsignadas: Especialidad[] = [];
                if (resEspecialidadesAsignadas.ok) {
                    EspecialidadesAsignadas = (await resEspecialidadesAsignadas.json()) || [];
                }

                setEspecialidades(listaEspecialidades);
                console.log(listaEspecialidades);

                // guardo sólo los ids que están asignados para marcar los checkboxes
                const idsAsignadas = EspecialidadesAsignadas.map((e) => String(e.id_especialidad));
                setEspecialidadesSeleccionadas(idsAsignadas);

                // sincronizo en datosTemp (si el formulario usa ese campo)
                setDatosTemp((prev) => ({ ...prev, especialidades: idsAsignadas }));
                // además, cargar obras sociales para futuros convenios
                try {
                    const resObras = await fetch("/api/obraSocial"); //modificar
                    const obrasJson = await resObras.json();
                    const listaObras: { id_obra: string; descripcion: string }[] = obrasJson.data || [];
                    setObrasSociales(listaObras);
                    // si datos tiene convenios, inicializarlos
                    const conveniosInicial = datos?.convenios || [];
                    setObrasSocialesSeleccionadas(conveniosInicial);
                    setDatosTemp((prev) => ({ ...prev, convenios: conveniosInicial }));
                } catch (err) {
                    console.warn("No se pudieron cargar obras sociales", err);
                }
            } catch (err) {
                console.error("Error cargando especialidades", err);
            } finally {
                setIsLoadingEspecialidades(false);
            }
        };

        cargar();
    }, [legajo_medico, setDatosTemp]);

    // Inicializar tipo/numero de matrícula desde datosTemp o datos
    // Inicializar tipo/numero de matrícula desde el objeto canonical `datos` una sola vez
    // (evitamos depender de datosTemp para prevenir loops de actualización)
    useEffect(() => {
        const from = datos?.matricula ?? datosTemp?.matricula ?? "";
        const { prefijo, numeroMat } = parseMatricula(from);
        setTipoMatricula(prefijo);
        setNumeroMatricula(numeroMat);
    }, [datos]);

    // Sincronizar matricula completa en datosTemp cuando cambien tipo/numero
    useEffect(() => {
        const nueva = buildMatricula(tipoMatricula, numeroMatricula);
        setDatosTemp((prev) => {
            // Prev es del tipo DatosEditables; asumimos que existe.
            if (prev.matricula === nueva) return prev; // no hay cambio real
            return { ...prev, matricula: nueva };
        });
    }, [tipoMatricula, numeroMatricula, setDatosTemp]);

    // handler para toggle
    const handleEspecialidadChange = (id: string, checked: boolean) => {
        setEspecialidadesSeleccionadas((prev) => {
            const next = checked ? [...prev.filter((x) => x !== id), id] : prev.filter((x) => x !== id);
            // actualizar datosTemp.especialidades si es necesario
            setDatosTemp((prevDatos) => ({ ...prevDatos, especialidades: next }));
            return next;
        });
    };
    const handleGuardar = async () => {
        try {
            setDatos (datosTemp);
            const guardadoExitoso = await guardarDatosEnBD(datosTemp, legajo_medico);

            if (guardadoExitoso) {
                setEditando(false);
                if (onGuardar){
                    onGuardar(datosTemp);
                }
                router.push("/administrativo/dashboard?tab=medicos");
            }
            else {
                setDatosTemp(datos);
            }
        }
        catch (error) {
            return false // XDD nose que podria poner aca
        }
    };

    const handleCancelar = () => {
        // Restaurar datos temporales
        setDatosTemp(datos);
        setEditando(false);
        // Redirigir al dashboard mostrando la pestaña "medicos"
        router.push("/administrativo/dashboard?tab=medicos");
    };

    return (
        <>
        {/* Botón Cancelar */}
        <div className="flex justify-start">
            <Button
                variant="outline"
                onClick={handleCancelar}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Modificar medico</CardTitle>
                <CardDescription>Actualizá los datos del médico</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-6"> 
                    {/* Nombre */}
                    <div className="grid gap-2">
                        <Label htmlFor="nombreMedico">Nombre</Label>
                        <Input 
                            id="nombreMedico"
                            type="text"
                            value={datosTemp.nombre}
                            onChange={(e) => setDatosTemp({...datosTemp, nombre: e.target.value,})}
                        />
                    </div>

                    {/* Apellido */}
                    <div className="grid gap-2">
                        <Label htmlFor="apellidoMedico">Apellido</Label>
                        <Input
                            id="apellidoMedico"
                            type="text"
                            value={datosTemp.apellido}
                            onChange={(e) => setDatosTemp({...datosTemp, apellido: e.target.value,})}
                        />
                    </div>

                    {/* DNI */}
                    <div className="grid gap-2">
                        <Label htmlFor="dniMedico">DNI</Label>
                        <Input
                            id="dniMedico"
                            type="text"
                            value={datosTemp.dni_medico}
                            onChange={(e) => setDatosTemp({...datosTemp, dni_medico: e.target.value,})}
                        />
                    </div>

                    {/* Matrícula */}
                    <div className="grid gap-2">
                        <Label htmlFor="tipoMatricula">Tipo de Matrícula</Label>
                        <Select onValueChange={(value) => setTipoMatricula(value)} value={tipoMatricula}>
                            <SelectTrigger id="tipoMatricula">
                                <SelectValue placeholder="Selecciona tipo de matrícula" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MN">Nacional (MN)</SelectItem>
                                <SelectItem value="MP">Provincial (MP)</SelectItem>
                                <SelectItem value="OT">Otro (OT)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Label htmlFor="numeroMatricula" className="mt-2">Número de Matrícula</Label>
                        <Input
                            id="numeroMatricula"
                            type="text"
                            placeholder="Ej: 7777"
                            value={numeroMatricula}
                            onChange={(e) => setNumeroMatricula(e.target.value.replace(/\D/g, ""))}
                        />
                        <div className="text-xs text-muted-foreground">Matrícula completa: {buildMatricula(tipoMatricula, numeroMatricula) || 'Sin matrícula'}</div>
                    </div>

                    {/* Especialidades */}
                    <div className="grid gap-4">
                        <Label>Especialidades</Label>
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                            {isLoadingEspecialidades ? (
                                <div>Cargando especialidades...</div>
                            ) : (
                                especialidades.map((esp) => (
                                    <div key={esp.id_especialidad} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`esp-${esp.id_especialidad}`}
                                            checked={especialidadesSeleccionadas.includes(String(esp.id_especialidad))}
                                            onCheckedChange={(checked) => handleEspecialidadChange(String(esp.id_especialidad), checked as boolean)}
                                        />
                                        <Label htmlFor={`esp-${esp.id_especialidad}`} className="text-sm font-normal cursor-pointer">
                                            {esp.descripcion}
                                        </Label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                            id="telefono"
                            type="tel"
                            value={datosTemp.telefono}
                            onChange={(e) => setDatosTemp({...datosTemp, telefono: e.target.value})}
                        />
                    </div>

                    {/* Pesos Argentinos */}
                    <div className="grid gap-2">
                        <Label htmlFor="pesosArgentinos">
                        Tarifa (Pesos Argentinos)
                        </Label>
                        <Input
                        id="pesosArgentinos"
                        type="number"

                        value={datosTemp.tarifa ?? ''}
                        onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? 0 : Number(v);
                            setDatosTemp({ ...datosTemp, tarifa: isNaN(num) ? 0 : num });
                        }}
                        />
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Mensaje de éxito */}
                    {exito && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                        <p className="text-sm">
                            Médico creado exitosamente. Redirigiendo...
                        </p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelar}
                             // disabled={isLoading} nose que esss
                            className="flex-1"
                        >
                        Cancelar
                        </Button>
                        <Button
                            type="button" 
                            //disabled={isLoading} 
                            className="flex-1"
                            onClick={handleGuardar}>
                            Guardar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        </>
    )
};

export default modificarDatosMedico;