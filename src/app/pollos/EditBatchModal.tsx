'use client';

import { useState, useTransition } from 'react';
import { Pencil, X } from 'lucide-react';
import { updatePoultryBatch } from './actions';

interface EditBatchModalProps {
  batch: {
    id: string;
    batchCode: string;
    startDate: string;
    initialQuantity: number;
    chickCostTotal: number;
  };
}

export function EditBatchModal({ batch }: EditBatchModalProps) {
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
        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        title="Editar datos del lote"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-600" />
              Editar Lote de Engorde
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Identificador del Lote
                </label>
                <input
                  type="text"
                  name="batchCode"
                  defaultValue={batch.batchCode}
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Fecha de Entrada al Galpón
                </label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={batch.startDate.split('T')[0]}
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    name="initialQuantity"
                    defaultValue={batch.initialQuantity}
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Costo Total Pollitos ($)
                  </label>
                  <input
                    type="number"
                    name="chickCostTotal"
                    defaultValue={batch.chickCostTotal}
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 rounded-lg transition"
                >
                  {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}