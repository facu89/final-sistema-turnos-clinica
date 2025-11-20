-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
/*es contexto para el copilot, no funciona para correr*/
CREATE TABLE public.agenda (
  id_agenda bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  legajo_medico bigint NOT NULL,
  fechainiciovigencia date,
  fechafinvigencia date,
  duracionturno time without time zone,
  CONSTRAINT agenda_pkey PRIMARY KEY (id_agenda),
  CONSTRAINT agenda_legajo_medico_fkey FOREIGN KEY (legajo_medico) REFERENCES public.medico(legajo_medico)
);
CREATE TABLE public.convenio (
  legajo_medico bigint NOT NULL,
  id_obra bigint NOT NULL,
  fecha_alta date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT convenio_pkey PRIMARY KEY (legajo_medico, id_obra, fecha_alta),
  CONSTRAINT convenio_legajo_medico_fkey FOREIGN KEY (legajo_medico) REFERENCES public.medico(legajo_medico),
  CONSTRAINT convenio_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES public.obra_social(id_obra)
);
CREATE TABLE public.dia_semana (
  id_agenda bigint NOT NULL,
  dia_semana smallint NOT NULL CHECK (dia_semana >= 1 AND dia_semana <= 7),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  CONSTRAINT dia_semana_pkey PRIMARY KEY (id_agenda, dia_semana, hora_inicio),
  CONSTRAINT dia_semana_id_agenda_fkey FOREIGN KEY (id_agenda) REFERENCES public.agenda(id_agenda)
);
CREATE TABLE public.especialidad (
  id_especialidad bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  descripcion text NOT NULL UNIQUE,
  CONSTRAINT especialidad_pkey PRIMARY KEY (id_especialidad)
);
CREATE TABLE public.medico (
  legajo_medico bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  dni_medico bigint UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  tarifa double precision,
  telefono numeric,
  id_agenda bigint,
  estado text NOT NULL DEFAULT 'activo'::text CHECK (estado = ANY (ARRAY['activo'::text, 'inactivo'::text])),
  matricula text,
  CONSTRAINT medico_pkey PRIMARY KEY (legajo_medico),
  CONSTRAINT medico_id_agenda_fkey FOREIGN KEY (id_agenda) REFERENCES public.agenda(id_agenda)
);
CREATE TABLE public.medico_especialidad (
  legajo_medico bigint NOT NULL,
  id_especialidad bigint NOT NULL,
  CONSTRAINT medico_especialidad_pkey PRIMARY KEY (legajo_medico, id_especialidad),
  CONSTRAINT medico_especialidad_legajo_medico_fkey FOREIGN KEY (legajo_medico) REFERENCES public.medico(legajo_medico),
  CONSTRAINT medico_especialidad_id_especialidad_fkey FOREIGN KEY (id_especialidad) REFERENCES public.especialidad(id_especialidad)
);
CREATE TABLE public.obra_social (
  id_obra bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  descripcion text NOT NULL UNIQUE,
  estado text NOT NULL,
  fecha_cambio_estado date NOT NULL DEFAULT CURRENT_DATE,
  sitio_web text,
  telefono_contacto bigint,
  created_at date,
  CONSTRAINT obra_social_pkey PRIMARY KEY (id_obra)
);
CREATE TABLE public.pago (
  id_pago bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  monto double precision NOT NULL CHECK (monto >= 0::numeric::double precision),
  fechapago date,
  reintegro boolean,
  cod_turno bigint,
  CONSTRAINT pago_pkey PRIMARY KEY (id_pago),
  CONSTRAINT pago_cod_turno_fkey FOREIGN KEY (cod_turno) REFERENCES public.turno(cod_turno)
);
CREATE TABLE public.patologia (
  cod_patologia bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  descripcion text NOT NULL UNIQUE,
  CONSTRAINT patologia_pkey PRIMARY KEY (cod_patologia)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dni_paciente bigint NOT NULL UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  telefono text,
  fecha_nacimiento date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  email text,
  tipo_usuario text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles_administrativos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  legajo_administrativo bigint NOT NULL,
  dni_administrativo bigint UNIQUE,
  nombre text NOT NULL,
  apellido text NOT NULL,
  email text UNIQUE,
  telefono text,
  fecha_nacimiento date,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  tipo_usuario text,
  CONSTRAINT profiles_administrativos_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_administrativos_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.solicitudes_especialidad (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  dni_paciente bigint,
  id_especialidad bigint,
  fechahorasolicitud timestamp without time zone,
  cod_patologia bigint,
  CONSTRAINT solicitudes_especialidad_pkey PRIMARY KEY (id),
  CONSTRAINT solicitudes_especialidad_dni_paciente_fkey FOREIGN KEY (dni_paciente) REFERENCES public.profiles(dni_paciente),
  CONSTRAINT solicitudes_especialidad_id_especialidad_fkey FOREIGN KEY (id_especialidad) REFERENCES public.especialidad(id_especialidad),
  CONSTRAINT solicitudes_especialidad_cod_patologia_fkey FOREIGN KEY (cod_patologia) REFERENCES public.patologia(cod_patologia)
);
CREATE TABLE public.solicitudes_medico (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  dni_paciente bigint,
  legajo_medico bigint,
  cod_patologia bigint,
  fechahorasolicitud timestamp without time zone,
  CONSTRAINT solicitudes_medico_pkey PRIMARY KEY (id),
  CONSTRAINT solicitudes_medico_dni_paciente_fkey FOREIGN KEY (dni_paciente) REFERENCES public.profiles(dni_paciente),
  CONSTRAINT solicitudes_medico_legajo_medico_fkey FOREIGN KEY (legajo_medico) REFERENCES public.medico(legajo_medico),
  CONSTRAINT solicitudes_medico_cod_patologia_fkey FOREIGN KEY (cod_patologia) REFERENCES public.patologia(cod_patologia)
);
CREATE TABLE public.turno (
  cod_turno bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  legajo_medico bigint NOT NULL,
  id_obra bigint,
  dni_paciente bigint,
  fecha_hora_turno timestamp without time zone,
  id_especialidad bigint,
  turno_pagado boolean,
  estado_turno text,
  turno_modificado boolean,
  presencia_turno boolean,
  CONSTRAINT turno_pkey PRIMARY KEY (cod_turno),
  CONSTRAINT turno_legajo_medico_fkey FOREIGN KEY (legajo_medico) REFERENCES public.medico(legajo_medico),
  CONSTRAINT turno_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES public.obra_social(id_obra),
  CONSTRAINT turno_dni_paciente_fkey FOREIGN KEY (dni_paciente) REFERENCES public.profiles(dni_paciente),
  CONSTRAINT turno_id_especialidad_fkey FOREIGN KEY (id_especialidad) REFERENCES public.especialidad(id_especialidad)
);