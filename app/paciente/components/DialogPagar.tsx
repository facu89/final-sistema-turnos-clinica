"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, CreditCard, User, Lock, Check } from "lucide-react";

interface DialogPagoTarjetaProps {
  turno: any;
  onCerrar: () => void;
  onPagoExitoso: () => void;
}

export default function DialogPagoTarjeta({
  turno,
  onCerrar,
  onPagoExitoso,
}: DialogPagoTarjetaProps) {
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<"ok" | "error" | null>(null);
  const [progreso, setProgreso] = useState(0);

  const validarCampos = (): boolean => {
    const nuevosErrores: string[] = [];

    // Número de tarjeta 
    if (!/^\d{16}$/.test(numero)) {
      nuevosErrores.push("El número de tarjeta debe tener 16 dígitos.");
    }

    // Nombre
    if (!/^[a-zA-Z\s]{3,}$/.test(nombre.trim())) {
      nuevosErrores.push("El nombre en la tarjeta no es válido.");
    }

    // Vencimiento
    const regexFecha = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regexFecha.test(vencimiento)) {
      nuevosErrores.push("El formato de vencimiento debe ser MM/AA.");
    } else {
      const [mm, aa] = vencimiento.split("/").map(Number);
      const fechaActual = new Date();
      const añoActual = fechaActual.getFullYear() % 100;
      const mesActual = fechaActual.getMonth() + 1;

      if (aa < añoActual || (aa === añoActual && mm < mesActual)) {
        nuevosErrores.push("La tarjeta está vencida.");
      }
    }

    // CVV (3 o 4 dígitos)
    if (!/^\d{3,4}$/.test(cvv)) {
      nuevosErrores.push("El CVV debe tener 3 o 4 dígitos.");
    }

    setErrores(nuevosErrores);
    return nuevosErrores.length === 0;
  };

  const handlePagar = () => {
    if (!validarCampos()) return;

    setLoading(true);
    setResultado(null);
    setProgreso(0);

    let p = 0;
    const intervalo = setInterval(()=>{
      p += 5;
      setProgreso(p);
      if(p>=100) clearInterval(intervalo);
    }, 100);

    setTimeout(() => {
      const pagoExitoso = Math.random() < 0.8; // 80% de chance
      setLoading(false);

      if (pagoExitoso) {
        setResultado("ok");
        setTimeout(() => {
          onPagoExitoso();
        }, 600);
      } else {
        setResultado("error");
      }
    }, 2000);
  };

  const fechaTurno =
    turno?.fecha_hora_turno
      ? new Date(turno.fecha_hora_turno).toLocaleDateString("es-AR")
      : turno?.fecha
      ? turno.fecha
      : "—";

  const horaTurno =
    turno?.fecha_hora_turno
      ? new Date(turno.fecha_hora_turno).toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : turno?.hora
      ? turno.hora
      : "—";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Pago del Turno
        </h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          <b>Médico:</b> {turno.nombre_medico} <br />
          <b>Especialidad:</b> {turno.desc_especialidad} <br />
          <b>Fecha:</b> {fechaTurno} - <b>Hora:</b> {horaTurno} <br />
          <b>Importe:</b> ${turno.tarifa ?? 5000}
        </p>

        {/* Formulario */}
        <div className="space-y-3 mb-4">
          {/* Número */}
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Número de la tarjeta"
              maxLength={16}
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
              className="pl-9"
            />
          </div>

          {/* Nombre */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Nombre en la tarjeta"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="pl-9 capitalize"
            />
          </div>

          {/* Fecha y CVV */}
          <div className="flex gap-2">
            <div className="relative w-1/2">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="MM/AA"
                maxLength={5}
                value={vencimiento}
                onChange={(e) =>
                  setVencimiento(e.target.value.replace(/[^0-9/]/g, ""))
                }
                className="pl-9"
              />
            </div>

            <div className="relative w-1/2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="CVV"
                maxLength={4}
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Mensajes de error */}
        {errores.length > 0 && (
          <ul className="text-red-500 text-sm mb-3 list-disc list-inside">
            {errores.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        {/* Resultado exitoso */}
        {resultado === "ok" && (
          <p className="text-green-600 text-center mb-2 font-medium">
            Pago confirmado con éxito
          </p>
        )}
        {resultado === "error" && (
          <p className="text-red-600 text-center mb-4 font-medium">
            Error al procesar el pago, intente nuevamente
          </p>
        )}

        {/* Botones */}
        <div>
        <div className="relative w-full mb-3">
          <Button
            onClick={handlePagar}
            disabled={loading}
            className={`relative w-full overflow-hidden transition-all duration-300 rounded-lg 
              ${
                resultado === "ok"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary hover:bg-primary/90"
              } text-white`}
          >
            
            {loading && (
              <div
                className="absolute left-0 top-0 h-full bg-purple-400 transition-all duration-100 ease-linear"
                style={{ width: `${progreso}%` }}
              />
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading && "Procesando..."}
              {!loading && resultado === "ok" && (
                <>
                  <Check className="w-10 h-10" />
                </>
              )}
              {!loading && resultado !== "ok" && "Pagar turno"}
          </span>
          </Button>
        </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={onCerrar}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
