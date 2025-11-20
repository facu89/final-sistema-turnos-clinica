import React from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Settings, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export const GeneralHeader = () => {
  return (
    <>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Panel Administrativo</h1>
            <p className="text-sm text-muted-foreground">ClinicaTurnos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button> */}
          <LogoutButton />
        </div>
      </div>
    </>
  );
};
