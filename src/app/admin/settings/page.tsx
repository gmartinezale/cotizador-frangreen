"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button, Input } from "@heroui/react";
import { useContext } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { SettingsRepository } from "@/data/settings.repository";

interface SettingsForm {
  shippingCost: number;
}

export default function SettingsPage() {
  const { showToast } = useContext(ToastContext);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { control, handleSubmit, reset } = useForm<SettingsForm>({
    defaultValues: { shippingCost: 0 },
  });

  useEffect(() => {
    const repository = SettingsRepository.instance();
    repository
      .getSettings()
      .then((data) => {
        if (data.success) {
          reset({ shippingCost: data.settings.shippingCost });
        }
      })
      .finally(() => setIsFetching(false));
  }, [reset]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      setIsLoading(true);
      const repository = SettingsRepository.instance();
      const result = await repository.updateSettings({ shippingCost: Number(data.shippingCost) });
      if (result.success) {
        showToast(true, "Configuración guardada correctamente");
      } else {
        showToast(false, "Error al guardar la configuración");
      }
    } catch {
      showToast(false, "Error al guardar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-0 sm:px-4 pt-4 sm:pt-6 pb-8">
      <h1 className="text-xl sm:text-2xl text-gray-900 dark:text-white font-bold mb-6">
        Configuraciones
      </h1>

      <div className="max-w-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
          Costos de envío
        </h2>

        {isFetching ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Costo de envío (CLP)
              </label>
              <Controller
                name="shippingCost"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    variant="bordered"
                    placeholder="Ej: 5000"
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    classNames={{
                      inputWrapper:
                        "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                    }}
                    startContent={
                      <span className="text-gray-400 text-sm">$</span>
                    }
                  />
                )}
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Este valor se aplicará automáticamente en las cotizaciones cuando se active el envío.
              </p>
            </div>

            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="w-full font-semibold"
            >
              Guardar configuración
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
