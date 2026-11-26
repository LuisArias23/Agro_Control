'use client';

import { useState, useTransition } from 'react';
import { Egg, PlusCircle, Check } from 'lucide-react';
import { addLayerDailyLog } from './actions';

export function LayerActionsForm({ batchId }: { batchId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [entryMode, setEntryMode] = useState<'bultos' | 'kilos'>('bultos');
  const [bultos, setBultos] = useState('');
  const [manualKg, setManualKg] = useState('');
  const [feedCost, setFeedCost] = useState('');

  const totalKg =
    entryMode === 'bultos'
      ? (parseFloat(bultos) || 0) * 40
      : parseFloat(manualKg) || 0;
  const numericCost = parseFloat(feedCost) || 0;
  const costPerKg = totalKg > 0 && numericCost > 0 ? Math.round(numericCost / totalKg) : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);
    formData.append('entryMode', entryMode);

    startTransition(async () => {
      await addLayerDailyLog(formData);
      setBultos('');
      setManualKg('');
      setFeedCost('');
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
        <form onSubmit={handleSubmit} className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          {/* Postura y Bajas */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Huevos Aptos</label>
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
          </div>

          {/* Bloque de Concentrado y Valor */}
          <div className="p-3 bg-white border border-amber-200/80 rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                Alimento Concentrado
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setEntryMode('bultos')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    entryMode === 'bultos'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Por Bultos (40 Kg)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('kilos')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    entryMode === 'kilos'
                      ? 'bg-white text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  Por Kilos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Marca</label>
                <select
                  name="feedBrand"
                  defaultValue="ITALCOL"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="ITALCOL">Italcol Ponedoras</option>
                  <option value="FINCA">Finca Ponedoras</option>
                  <option value="CONTEGRAL">Contegral</option>
                  <option value="OTRO">Otra marca</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Etapa / Fase</label>
                <select
                  name="feedStage"
                  defaultValue="Levante"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold text-slate-800"
                >
                  <option value="Cría / Iniciación">Cría / Iniciación</option>
                  <option value="Levante">Levante</option>
                  <option value="Pre-postura">Pre-postura</option>
                  <option value="Postura Fase 1">Postura Fase 1</option>
                  <option value="Postura Fase 2">Postura Fase 2</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {entryMode === 'bultos' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Cantidad Bultos (40 Kg)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    name="bultos"
                    value={bultos}
                    onChange={(e) => setBultos(e.target.value)}
                    placeholder="Ej: 1 o 0.5"
                    min="0"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Cantidad Kilos (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="manualKg"
                    value={manualKg}
                    onChange={(e) => setManualKg(e.target.value)}
                    placeholder="Ej: 15.5"
                    min="0"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                  Valor Total Alimento ($)
                </label>
                <input
                  type="number"
                  step="100"
                  name="feedCost"
                  value={feedCost}
                  onChange={(e) => setFeedCost(e.target.value)}
                  placeholder="Ej: 88000"
                  min="0"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-emerald-900"
                />
              </div>
            </div>

            {totalKg > 0 && (
              <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                Total: <strong>{totalKg.toFixed(1)} Kg</strong>
                {costPerKg > 0 && (
                  <>
                    {' '}
                    · Valor/Kg: <strong>${costPerKg.toLocaleString('es-CO')}</strong>
                  </>
                )}
              </p>
            )}
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