import React from 'react'
import { TurnosMedico } from './TurnosMedico'

const page = () => {
  return (
    <div className="flex flex-column align-items ">
      <h2 className="text-2xl font-bold m-2">Turnos del Medico</h2>
      <div className='m-5 p-2'>

        <TurnosMedico></TurnosMedico>
      </div>
    </div>
  )
}

export default page
