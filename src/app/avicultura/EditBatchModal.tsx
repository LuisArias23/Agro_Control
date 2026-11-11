'use client';

import { useState, useTransition } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { updatePoultryBatch } from './actions';

interface BatchData {
  id: string;
  batchCode: string;
  startDate: string;
  initialQuantity: number;
  chickCostTotal: number;
  feedersCount: number;
  drinkersCount: number;
}

export function EditBatchModal({ batch }: { batch: BatchData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('id', batch.id);

    startTransition(async () => {
      await updatePoultryBatch(formData);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
        title="Editar Lote y Equipos"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Editar Lote y Equipos</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  name="batchCode"
                  defaultValue={batch.batchCode}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Entrada</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date(batch.startDate).toISOString().split('T')[0]}
                    required
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pollos Iniciales</label>
                  <input
                    type="number"
                    name="initialQuantity"
                    defaultValue={batch.initialQuantity}
                    required
                    min="1"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Total Inicial ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="chickCostTotal"
                  defaultValue={batch.chickCostTotal}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl space-y-2">
                <span className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                  Equipos en uso para este lote
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Comederos (Und)</label>
                    <input
                      type="number"
                      name="feedersCount"
                      defaultValue={batch.feedersCount || 0}
                      min="0"
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Bebederos (Und)</label>
                    <input
                      type="number"
                      name="drinkersCount"
                      defaultValue={batch.drinkersCount || 0}
                      min="0"
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-sky-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}