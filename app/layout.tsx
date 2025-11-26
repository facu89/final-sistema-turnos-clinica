import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Suspense } from "react";
import { ClientAnalytics } from "@/components/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicaTurnos - Sistema de Gestión Médica",
  description: "Sistema integral de gestión de turnos para clínicas médicas",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>{children}</Suspense>
        <ClientAnalytics />
      </body>
    </html>
  );
}
