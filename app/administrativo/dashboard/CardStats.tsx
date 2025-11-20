import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Calendar,
  UserPlus,
  AlertCircle,
} from "lucide-react"

export const CardStats = () => {
  return (
    <>
    
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Turnos Hoy</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pacientes</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Médicos</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ausencias</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
            </div>
    </>
  )
}

