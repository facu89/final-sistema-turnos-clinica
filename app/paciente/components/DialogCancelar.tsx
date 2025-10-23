import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DialogCancelarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: () => void;
}

const DialogCancelar: React.FC<DialogCancelarProps> = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar turno</DialogTitle>
        </DialogHeader>
        <p>¿Estás seguro de que deseas cancelar este turno?</p>
        <p>Este cambio no es reversible.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Cargando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogCancelar;
