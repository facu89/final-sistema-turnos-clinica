import { LogoutButton } from "@/components/logout-button";
import { TableUsersAdmin } from "@/app/administrador/table-user-admin";
export default function Page() {
  return (
    <div className="flex flex-col min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <header className="flex flex-row gap-4 mb-6 items-center">
          <h1 className="text-2xl font-bold">Administrar Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            <LogoutButton />
          </p>
        </header>
      </div>
      <div>
        <TableUsersAdmin />
      </div>
    </div>
  );
}
