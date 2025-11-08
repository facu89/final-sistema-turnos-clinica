"use client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, PlusCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DatosEditables {
    nombre: string;
    apellido: string;
    dni_medico: string;
    telefono: string;
    matricula: string;
    especialidades?: string[];
    tarifa: number;
    convenios?: ConvenioMedico[];
}

//datos del convenio de medico
interface ConvenioMedico {
    id_obra: string;
    descripcion: string;
    estado?: string;
    telefono_contacto?: string | null;
    sitio_web?: string | null;
    fecha_alta?: string;
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
    console.log("nuevos datos:", nuevosDatos);
    
    console.log("guardando en BD");
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
    
    const [convenios, setConvenios] = useState<ConvenioMedico[]>([]);
    const [obrasSociales, setObrasSociales] = useState<{ id_obra: string; descripcion: string }[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);

    const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
    const [fechaInicio, setFechaInicio] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
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
                const listaEspecialidadesJSON = await resTODAS.json();
                const listaEspecialidades: Especialidad[] = listaEspecialidadesJSON.data;

                // especialidades asignadas al médico
                const resEspecialidadesAsignadas = await fetch(
                    `/api/medico/medico-especialidad?legajo_medico=${legajo_medico}`
                );
                let EspecialidadesAsignadas: Especialidad[] = [];
                if (resEspecialidadesAsignadas.ok) {
                    EspecialidadesAsignadas = (await resEspecialidadesAsignadas.json()) || [];
                }
                setEspecialidades(listaEspecialidades);

                // guardo sólo los ids que están asignados para marcar los checkboxes
                const idsAsignadas = EspecialidadesAsignadas.map((e) => String(e.id_especialidad));
                setEspecialidadesSeleccionadas(idsAsignadas);

                // sincronizo en datosTemp (si el formulario usa ese campo)
                setDatosTemp((prev) => ({ ...prev, especialidades: idsAsignadas }));
                // además, cargar obras sociales para futuros convenios
                try {
                const resConvenios = await fetch(`/api/medico/medico-obraSocial?legajo_medico=${legajo_medico}`, {
                cache: "no-store",
                });
                const listaCruda = resConvenios.ok ? await resConvenios.json() : [];

                // 🔧 Normalizamos la estructura a la interfaz ConvenioMedico
                const listaConvenios: ConvenioMedico[] = listaCruda.map((c: any) => ({
                id_obra: String(c.obra_social?.id_obra ?? ""),
                descripcion: c.obra_social?.descripcion ?? "",
                estado: c.obra_social?.estado ?? "",
                telefono_contacto: c.obra_social?.telefono_contacto ?? null,
                sitio_web: c.obra_social?.sitio_web ?? null,
                fecha_alta: c.fecha_alta ?? null,
                }));

                setConvenios(listaConvenios);
                setDatosTemp((prev) => ({ ...prev, convenios: listaConvenios }));


                const resObras = await fetch("/api/obraSocial");
                const obrasJson = await resObras.json();
                setObrasSociales(obrasJson.data || []);
                } catch (err) {
                console.warn("Error cargando convenios/obras", err);
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

    // Ya no necesitamos este handler porque el RadioGroup maneja la selección directamente
    // Lo mantenemos por compatibilidad con otras partes del código que puedan usarlo
    const handleEspecialidadChange = (id: string, checked: boolean) => {
        if (checked) {
            setEspecialidadesSeleccionadas([id]);
            setDatosTemp((prevDatos) => ({ ...prevDatos, especialidades: [id] }));
        }
    };
    const handleGuardar = async () => {
        try {
            setDatos (datosTemp);
            console.log("datosTEMPO:", datosTemp);
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

    // eliminar convenio tentativamente
    const handleEliminarConvenio = (id_obra: string) => {
        setConvenios((prev) => prev.filter((c) => c.id_obra !== id_obra));
        setDatosTemp((prev) => ({
        ...prev,
        convenios: prev.convenios?.filter((c) => c.id_obra !== id_obra),
        }));
    };

    // agregar convenio tentativamente desde modal
    const handleAgregarConvenio = () => {
        if (!obraSeleccionada) return;

        const obra = obrasSociales.find((o) => o.id_obra === obraSeleccionada);
        if (!obra) return;

        const hoy = new Date().toISOString().split("T")[0];
        if (fechaInicio < hoy) {
            alert("La fecha de inicio no puede ser anterior a la fecha actual.");
            return;
        }

        const nuevoConvenio: ConvenioMedico = {
            id_obra: obra.id_obra,
            descripcion: obra.descripcion,
            fecha_alta: fechaInicio, // usamos la fecha seleccionada
        };

        setConvenios((prev) => [...prev, nuevoConvenio]);
        setDatosTemp((prev) => ({
            ...prev,
            convenios: [...(prev.convenios || []), nuevoConvenio],
        }));

        // reseteamos estado del modal
        setObraSeleccionada(null);
        setFechaInicio(new Date().toISOString().split("T")[0]);
        setModalAbierto(false);
        console.log("DatosTEMPPPP::::")
        console.log(datosTemp);
    };

    const obrasDisponibles = obrasSociales.filter(
        (o) => !convenios.some((c) => c.id_obra === o.id_obra)
    );

    const faltanCampos =
        !String(datosTemp.nombre ?? "").trim() ||
        !String(datosTemp.apellido ?? "").trim() ||
        !String(datosTemp.dni_medico ?? "").trim() ||
        !String(datosTemp.telefono ?? "").trim() ||
        !String(datosTemp.matricula ?? "").trim() ||
        !datosTemp.tarifa ||
        !(Array.isArray(datosTemp.especialidades) && datosTemp.especialidades.length > 0);


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
        <Card className="max-w-2xl mx-auto mt-8 shadow-md rounded-xl">
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
                        <div className="grid gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                            {isLoadingEspecialidades ? (
                                <div>Cargando especialidades...</div>
                            ) : (
                                <RadioGroup
                                    value={especialidadesSeleccionadas[0] || ""}
                                    onValueChange={(val) => setEspecialidadesSeleccionadas([val])}
                                    className="grid grid-cols-2 gap-3"
                                >
                                    {especialidades.map((esp) => (
                                        <div key={esp.id_especialidad} className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value={String(esp.id_especialidad)}
                                                id={`esp-${esp.id_especialidad}`}
                                            />
                                            <Label htmlFor={`esp-${esp.id_especialidad}`} className="text-sm font-normal cursor-pointer">
                                                {esp.descripcion}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                            id="telefono"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={datosTemp.telefono}
                            onChange={(e) =>
                                setDatosTemp({
                                ...datosTemp,
                                telefono: e.target.value.replace(/\D/g, ""), // elimina cualquier carácter no numérico
                                })
                            }
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
                            min="0"
                            step="1"
                            value={datosTemp.tarifa === 0 ? "" : datosTemp.tarifa}
                            onChange={(e) => {
                                const v = e.target.value;
                                const num = v === "" ? 0 : Number(v);
                                setDatosTemp({ ...datosTemp, tarifa: num });
                            }}
                        />
                    </div>

                    {/* Convenios actuales */}
                    <div className="gird gap-4 mt-6">
                        <Label>Convenios del médico</Label>
                        <div className="flex justify-end mb-2">
                            <Button variant="outline" size="sm" onClick={() => setModalAbierto(true)}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Añadir convenio
                            </Button>
                        </div>
                        {convenios.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            El médico no tiene convenios registrados.
                        </p>
                        ) : (
                        <div className="border rounded-lg divide-y">
                            {convenios.map((conv) => (
                            <div key={conv.id_obra} className="flex items-center justify-between p-3">
                                <div>
                                    <p className="font-medium">{conv.descripcion}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Inicio: {conv.fecha_alta}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEliminarConvenio(conv.id_obra)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                    

                    {/* Modal de obras sociales disponibles */} 
                    <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Nuevo convenio</DialogTitle>
                            </DialogHeader>

                            {/* Selector de obra social */}
                            <div className="mt-2">
                                <Label>Obra social</Label>
                                <Select
                                    onValueChange={(value) => setObraSeleccionada(value)}
                                    value={obraSeleccionada || ""}
                                >
                                    <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Selecciona una obra social" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {obrasDisponibles.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                        No hay obras sociales disponibles
                                        </SelectItem>
                                    ) : (
                                        obrasDisponibles.map((obra) => (
                                        <SelectItem key={obra.id_obra} value={obra.id_obra}>
                                            {obra.descripcion}
                                        </SelectItem>
                                        ))
                                    )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Selector de fecha */}
                            <div className="mt-4">
                                <Label>Fecha de inicio</Label>
                                <Input
                                    type="date"
                                    className="mt-1"
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const hoy = new Date().toISOString().split("T")[0];
                                        const fechaSeleccionada = e.target.value;

                                        setFechaInicio(fechaSeleccionada);
                                    }}
                                />
                                <div className="text-xs text-muted-foreground">Ingrese una fecha superior a la actual</div>
                            </div>

                            <div className="flex justify-end gap-2 mt-5">
                                <Button variant="ghost" onClick={() => setModalAbierto(false)}>
                                    <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button
                                    variant="default"
                                    disabled={!obraSeleccionada}
                                    onClick={handleAgregarConvenio}
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" /> Añadir
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>


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
                            className="flex-1"
                            
                        >
                        Cancelar
                        </Button>
                        <Button
                            type="button" 
                            className="flex-1"
                            onClick={handleGuardar}
                            disabled={faltanCampos}>
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