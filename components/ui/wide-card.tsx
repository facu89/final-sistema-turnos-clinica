import {
  Card as BaseCard,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Crear una Card más amplia
function WideCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <BaseCard
      className={cn(
        "w-full max-w-none mx-0", // Eliminar restricciones de ancho
        className
      )}
      {...props}
    />
  );
}

export { WideCard, CardContent, CardHeader, CardTitle, CardDescription };
