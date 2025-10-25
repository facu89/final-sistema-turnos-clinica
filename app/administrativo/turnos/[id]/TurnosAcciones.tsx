import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, RotateCcw, UserX } from "lucide-react"

export const TurnosAcciones = () => {
  return (
    <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
                <CardDescription>Gestiona este turno</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">

                <Button className="w-full green" >
                  <UserX className="h-4 w-4 mr-2" />
                  Marcar Presencia
                </Button>

              </CardContent>
            </Card>
  )
}

