"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { UserPlus } from "lucide-react";

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
}

interface UserSignUpFormProps {
  onUserAdded: () => void;
  userType: string;
  tableName: string;
  fieldConfigs: FieldConfig[];
  uniqueField: string;
  uniqueFieldMapping?: string; // ← NUEVO
  fieldMappings: Record<string, string>;
  dialogTitle?: string;
  dialogDescription?: string;
  buttonLabel?: string;
}

export function UserSignUpForm({
  onUserAdded,
  userType,
  tableName,
  fieldConfigs,
  uniqueField,
  uniqueFieldMapping, // ← NUEVO
  fieldMappings,
  dialogTitle,
  dialogDescription,
  buttonLabel,
}: UserSignUpFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const resetForm = () => {
    setFormState({});
    setError(null);
  };

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Password validation (sin cambios)
    if (formState.password && formState.repeatPassword) {
      if (formState.password !== formState.repeatPassword) {
        setError("Las contraseñas no coinciden");
        setIsLoading(false);
        return;
      }
      if (formState.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setIsLoading(false);
        return;
      }
    }

    try {
      // ✅ ARREGLAR EL MAPEO DEL CAMPO ÚNICO
      const formFieldName = uniqueFieldMapping || uniqueField;
      const dbFieldName = fieldMappings[formFieldName] || uniqueField; // ← NUEVO
      const uniqueValue = formState[formFieldName];

      if (!uniqueValue) {
        setError("El campo único es requerido");
        setIsLoading(false);
        return;
      }

      console.log("Verificando campo único:", {
        tableName,
        uniqueField,
        formFieldName,
        dbFieldName, // ← NUEVO
        uniqueValue,
      });

      // ✅ USAR EL CAMPO CORRECTO DE LA DB
      const { data: existing, error: uniqueCheckError } = await supabase
        .from(tableName)
        .select(dbFieldName) // ← CAMBIO: usar dbFieldName
        .eq(dbFieldName, uniqueValue) // ← CAMBIO: usar dbFieldName
        .maybeSingle();

      if (uniqueCheckError) {
        console.error("Error en verificación única:", uniqueCheckError);
        throw new Error(
          "Error al verificar campo único: " + uniqueCheckError.message
        );
      }

      if (existing) {
        setError(`El ${formFieldName} ya está registrado en el sistema.`);
        setIsLoading(false);
        return;
      }

      let userId = null;
      if (
        userType === "Administrativo" &&
        formState.email &&
        formState.password
      ) {
        const response = await fetch("/api/administrativo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formState.email.trim().toLowerCase(),
            password: formState.password,
            firstName: formState.firstName,
            lastName: formState.lastName,
            dni: formState.dni,
            phone: formState.phone,
            birthDate: formState.birthDate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear usuario administrativo"
          );
        }

        resetForm();
        setIsOpen(false);
        onUserAdded();
        return;
      } else if (formState.email && formState.password) {
        // Para otros tipos de usuario, usar signUp normal
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formState.email.trim().toLowerCase(),
            password: formState.password,
            options: {
              emailRedirectTo: undefined,
            },
          }
        );
        if (authError) {
          throw new Error("Error al crear usuario: " + authError.message);
        }
        if (!authData.user) {
          throw new Error("No se pudo crear el usuario");
        }
        userId = authData.user.id;
      }

      // 3. Solo crear perfil manual si NO es administrativo
      if (userType !== "Administrativo") {
        const insertData: Record<string, any> = {};
        Object.entries(fieldMappings).forEach(([formField, dbField]) => {
          insertData[dbField] = formState[formField] || null;
        });
        if (userId) {
          insertData.id = userId;
        }
        insertData.tipo_usuario = userType;

        const { error: profileError } = await supabase
          .from(tableName)
          .insert(insertData);

        if (profileError) {
          setError(`Error al crear perfil: ${profileError.message}`);
          setIsLoading(false);
          return;
        }
      }

      resetForm();
      setIsOpen(false);
      onUserAdded();
    } catch (error: unknown) {
      console.error("Error completo:", error);
      setError(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          {buttonLabel || `Agregar Usuario ${userType}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle || `Agregar Usuario ${userType}`}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription || `Crea un nuevo usuario de tipo ${userType}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldConfigs.map((field) => (
            <div className="grid gap-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={formState[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </div>
          ))}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
