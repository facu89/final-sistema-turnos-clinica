import Image from 'next/image';

export default function SinAusencias(){
    return(
        <div className="overflow-x-auto flex flex-col items-center">
            <h2 className='justify-center mb-10'>El paciente no registra Ausencias</h2>
            <Image src="/no-abscenses.svg" alt="Imagen sin ausencias" width={200} height={150} className='mx-auto'/>
        </div>
    )
}