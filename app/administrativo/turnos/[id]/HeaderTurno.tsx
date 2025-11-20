import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const HeaderTurno = ({ turno }: any) => {
  return (
    <>
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                Detalle del Turno #{turno?.cod_turno}
              </h1>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
export default HeaderTurno;
