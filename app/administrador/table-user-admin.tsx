"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserSignUpForm } from "@/components/user-sign-up-form";

// ⬇️ imports para el modal/inputs de edición
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminUser {
  id: string;
  dni_administrativo: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  tipo_usuario: string;
  created_at: string;
  nombre: string;
  apellido: string;
  email?: string | null; // por si lo tenés en la tabla
}

export function TableUsersAdmin() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el dialog de confirmación (eliminar)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    userId: "",
    userName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // ⬇️ Estados para edición
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    nombre: "",
    apellido: "",
    telefono: "",
    fecha_nacimiento: "",
    dni_administrativo: "",
    email: "",
  });

  const supabase = createClient();

  const fieldConfigs = [
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "usuario@ejemplo.com",
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: true,
      placeholder: "Mínimo 6 caracteres",
    },
    {
      name: "repeatPassword",
      label: "Repetir Contraseña",
      type: "password",
      required: true,
      placeholder: "Confirmar contraseña",
    },
    {
      name: "firstName",
      label: "Nombre",
      type: "text",
      required: true,
      placeholder: "Nombre",
    },
    {
      name: "lastName",
      label: "Apellido",
      type: "text",
      required: true,
      placeholder: "Apellido",
    },
    {
      name: "dni",
      label: "DNI",
      type: "text",
      required: true,
      placeholder: "12345678",
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "tel",
      required: false,
      placeholder: "+54 9 11 1234-5678",
    },
    {
      name: "birthDate",
      label: "Fecha de Nacimiento",
      type: "date",
      required: false,
    },
  ];

  const fieldMappings = {
    email: "email",
    firstName: "nombre",
    lastName: "apellido",
    dni: "dni_administrativo",
    phone: "telefono",
    birthDate: "fecha_nacimiento",
  };

  const openDeleteDialog = (userId: string, userName: string) => {
    setDeleteDialog({
      open: true,
      userId,
      userName,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      userId: "",
      userName: "",
    });
  };

  const deleteUserFromAuth = async (userId: string) => {
    try {
      const response = await fetch("/api/administrativo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error en deleteUserFromAuth:", error);
      throw error;
    }
  };

  const deleteAdminUser = async (userId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      await deleteUserFromAuth(userId);
      loadAdminUsers();
      closeDeleteDialog();
    } catch (error: unknown) {
      console.error("Error al eliminar usuario:", error);
      setError(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (deleteDialog.userId) {
      deleteAdminUser(deleteDialog.userId);
    }
  };

  const loadAdminUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("profiles_administrativos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setAdminUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  // ⬇️ Abrir modal de edición con datos del usuario
  const openEdit = (user: AdminUser) => {
    setEditForm({
      id: user.id,
      nombre: user.nombre ?? "",
      apellido: user.apellido ?? "",
      telefono: user.telefono ?? "",
      fecha_nacimiento: user.fecha_nacimiento ?? "",
      dni_administrativo: user.dni_administrativo ?? "",
      email: user.email ?? "",
    });
    setEditOpen(true);
  };

  // ⬇️ Guardar cambios (PUT a /api/administrativo)
  const submitEdit = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/administrativo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        alert(json?.error || "No se pudo actualizar");
        return;
      }
      setEditOpen(false);
      await loadAdminUsers();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Cargando usuarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full !max-w-none mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios Administrativos</CardTitle>
              <CardDescription>
                Gestiona los usuarios con permisos administrativos del sistema
              </CardDescription>
            </div>

            <UserSignUpForm
              onUserAdded={loadAdminUsers}
              userType="Administrativo"
              tableName="profiles_administrativos"
              fieldConfigs={fieldConfigs}
              uniqueField="dni_administrativo"
              uniqueFieldMapping="dni"
              fieldMappings={fieldMappings}
              dialogTitle="Agregar Usuario Administrativo"
              dialogDescription="Crea un nuevo usuario con permisos administrativos"
              buttonLabel="Agregar Administrativo"
            />
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAdminUsers}
                className="mt-2"
              >
                Reintentar
              </Button>
            </div>
          )}

          {adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No hay usuarios administrativos
              </h3>
              <p className="text-sm text-gray-500">
                Comienza agregando tu primer usuario administrativo
              </p>
            </div>
          ) : (
            <div className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Nombre</th>
                      <th className="text-left p-3">DNI</th>
                      <th className="text-left p-3">Teléfono</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {user.nombre} {user.apellido}
                        </td>
                        <td className="p-3">{user.dni_administrativo}</td>
                        <td className="p-3">{user.telefono || "N/A"}</td>
                        <td className="p-3">{user.tipo_usuario}</td>
                        <td className="p-3 flex gap-2">
                          {/* ⬇️ Botón Modificar */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(user)}
                          >
                            Modificar
                          </Button>

                          {/* ⬇️ Botón Eliminar */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              openDeleteDialog(
                                user.id,
                                `${user.nombre} ${user.apellido}`
                              )
                            }
                            disabled={isDeleting}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {adminUsers.length} usuario{adminUsers.length !== 1 ? "s" : ""}{" "}
              administrativo{adminUsers.length !== 1 ? "s" : ""}
            </p>
            <Button variant="outline" onClick={loadAdminUsers}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ⬇️ Modal de edición */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar usuario</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div>
              <Label>Nombre</Label>
              <Input
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm({ ...editForm, nombre: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Apellido</Label>
              <Input
                value={editForm.apellido}
                onChange={(e) =>
                  setEditForm({ ...editForm, apellido: e.target.value })
                }
              />
            </div>
            <div>
              <Label>DNI</Label>
              <Input
                value={editForm.dni_administrativo}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    dni_administrativo: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={editForm.telefono}
                onChange={(e) =>
                  setEditForm({ ...editForm, telefono: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input
                type="date"
                value={editForm.fecha_nacimiento || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    fecha_nacimiento: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo eliminar (ya lo tenías) */}
      <DeleteUserDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        onConfirm={handleConfirmDelete}
        userName={deleteDialog.userName}
        isLoading={isDeleting}
      />
    </>
  );
}
