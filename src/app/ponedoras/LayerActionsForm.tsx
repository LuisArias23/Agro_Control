'use client';

import { useState, useTransition } from 'react';
import { Egg, PlusCircle, Check } from 'lucide-react';
import { addLayerDailyLog } from './actions';

export function LayerActionsForm({ batchId }: { batchId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addLayerDailyLog(formData);
      setIsOpen(false);
    });
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-amber-950 rounded-lg text-xs font-bold transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-amber-700" />
          Registrar Postura y Alimentación del Día
        </span>
        <Egg className="w-4 h-4 text-amber-700" />
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Huevos Comerciales</label>
              <input
                type="number"
                name="eggsCollected"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-amber-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Rotos / Sucios</label>
              <input
                type="number"
                name="eggsBroken"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white text-rose-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Bajas (Gallinas)</label>
              <input
                type="number"
                name="mortalityCount"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Bultos Concentrado</label>
              <input
                type="number"
                step="0.5"
                name="bultos"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Kilos Sueltos</label>
              <input
                type="number"
                step="0.1"
                name="manualKg"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Notas de la Jornada</label>
            <input
              type="text"
              name="notes"
              placeholder="Ej: Calcio extra en agua, cambio de cama"
              className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              {isPending ? 'Guardando...' : 'Guardar Postura'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}