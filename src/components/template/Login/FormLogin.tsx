"use client";

import { authenticate } from "@/lib/actions";
import { useActionState } from "react";
import { 
  ExclamationCircleIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  ArrowRightIcon 
} from "@heroicons/react/24/solid";
import { Button, Input } from "@heroui/react";

export default function FormLogin() {
  const [state, action, pending] = useActionState(authenticate, undefined);

  return (
    <div className="w-full p-6 sm:p-8 bg-white dark:bg-[#232323] rounded-2xl shadow-xl dark:shadow-none dark:ring-1 dark:ring-gray-800 transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenido de nuevo
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5" action={action}>
        <Input
          id="email"
          type="email"
          name="email"
          label="Correo electrónico"
          placeholder="tu@email.com"
          isRequired
          variant="bordered"
          startContent={
            <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none flex-shrink-0" />
          }
          errorMessage={state?.errors?.email?.[0]}
          isInvalid={!!state?.errors?.email}
          classNames={{
            label: "text-gray-700 dark:text-gray-300",
            input: "text-gray-900 dark:text-white",
            inputWrapper: [
              "border-gray-300 dark:border-gray-600",
              "hover:border-gray-400 dark:hover:border-gray-500",
              "focus-within:!border-blue-500",
              "bg-gray-50 dark:bg-gray-800/50",
              "transition-colors duration-200",
            ],
          }}
        />

        <Input
          id="password"
          type="password"
          name="password"
          label="Contraseña"
          placeholder="••••••••"
          isRequired
          minLength={6}
          variant="bordered"
          startContent={
            <LockClosedIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none flex-shrink-0" />
          }
          errorMessage={state?.errors?.password?.[0]}
          isInvalid={!!state?.errors?.password}
          classNames={{
            label: "text-gray-700 dark:text-gray-300",
            input: "text-gray-900 dark:text-white",
            inputWrapper: [
              "border-gray-300 dark:border-gray-600",
              "hover:border-gray-400 dark:hover:border-gray-500",
              "focus-within:!border-blue-500",
              "bg-gray-50 dark:bg-gray-800/50",
              "transition-colors duration-200",
            ],
          }}
        />

        {/* Error message */}
        {state?.message && (
          <div 
            className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"
            role="alert"
          >
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          color="primary"
          isLoading={pending}
          className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200"
          endContent={!pending && <ArrowRightIcon className="w-4 h-4" />}
        >
          {pending ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}
