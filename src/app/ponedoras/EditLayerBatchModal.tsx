'use client';

import { useState, useTransition } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { updateLayerBatch } from './actions';

interface LayerBatchData {
  id: string;
  batchCode: string;
  startDate: string;
  initialHens: number;
  costTotal: number;
}

export function EditLayerBatchModal({ batch }: { batch: LayerBatchData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('id', batch.id);

    startTransition(async () => {
      await updateLayerBatch(formData);
      setIsOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
        title="Editar Lote"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Editar Lote de Ponedoras</h3>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gallinas Iniciales</label>
                  <input
                    type="number"
                    name="initialHens"
                    defaultValue={batch.initialHens}
                    required
                    min="1"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Inversión Inicial ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="costTotal"
                  defaultValue={batch.costTotal}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
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
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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