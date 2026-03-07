import React from "react";
import Image from "next/image";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-[#1a1a1a] dark:to-[#232323] transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo and branding */}
      <a
        href="#"
        className="relative flex items-center gap-3 mb-8 group"
        aria-label="Ir al inicio"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden">
          <Image
            src="/logo.png"
            alt="Frangreen Logo"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-xl font-bold whitespace-nowrap text-gray-900 dark:text-white hidden sm:block">
          Cotizador Fran Green
        </span>
      </a>

      {/* Main content */}
      <div className="relative w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="relative mt-8 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Cotizador. Todos los derechos reservados.
      </p>
    </div>
  );
}
