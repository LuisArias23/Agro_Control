'use client';

import { useState, useTransition } from 'react';
import { Utensils, Scale } from 'lucide-react';
import { addFishDailyLog, addFishSampling } from './actions';

export function FishActionsForm({ batchId }: { batchId: string }) {
  const [activeTab, setActiveTab] = useState<'NONE' | 'FEED' | 'SAMPLE'>('NONE');
  const [isPending, startTransition] = useTransition();

  const handleFeedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);
    startTransition(async () => {
      await addFishDailyLog(formData);
      setActiveTab('NONE');
    });
  };

  const handleSampleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);
    startTransition(async () => {
      await addFishSampling(formData);
      setActiveTab('NONE');
    });
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'FEED' ? 'NONE' : 'FEED')}
          className={`w-1/2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${
            activeTab === 'FEED'
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          Ración Diaria / Bajas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'SAMPLE' ? 'NONE' : 'SAMPLE')}
          className={`w-1/2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${
            activeTab === 'SAMPLE'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Muestreo (Gramos)
        </button>
      </div>

      {activeTab === 'FEED' && (
        <form onSubmit={handleFeedSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Bajas (Mort.)</label>
              <input
                type="number"
                name="mortalityCount"
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Proteína (%)</label>
              <select
                name="proteinPercentage"
                defaultValue="38"
                className="w-full text-xs px-2 py-1.5 border rounded-lg bg-white font-medium"
              >
                <option value="45">45% (Alevinaje)</option>
                <option value="38">38% (Iniciación)</option>
                <option value="32">32% (Levante)</option>
                <option value="28">28% (Engorde)</option>
                <option value="24">24% (Acabado)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Kilos Servidos</label>
              <input
                type="number"
                step="0.1"
                name="feedKgServed"
                placeholder="Ej: 4.5"
                required
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Costo Alimento ($)</label>
              <input
                type="number"
                name="feedCost"
                placeholder="Ej: 22000"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('NONE')}
              className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1 bg-sky-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              {isPending ? 'Guardando...' : 'Guardar Ración'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'SAMPLE' && (
        <form onSubmit={handleSampleSubmit} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-emerald-950 mb-0.5">Peces en Muestra</label>
              <input
                type="number"
                name="sampleCount"
                defaultValue="20"
                required
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-emerald-950 mb-0.5">Peso Promedio (Gramos)</label>
              <input
                type="number"
                step="0.1"
                name="avgWeightGrams"
                placeholder="Ej: 285.5 g"
                required
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-emerald-900"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-medium text-emerald-950 mb-0.5">Notas Muestreo</label>
              <input
                type="text"
                name="notes"
                placeholder="Ej: Excelente vigor"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('NONE')}
              className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              {isPending ? 'Calculando...' : 'Actualizar Biomasa'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}