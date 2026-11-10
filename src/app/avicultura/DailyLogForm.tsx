'use client';

import { useState, useEffect, useTransition } from 'react';
import { addDailyLog } from './actions';
import { PlusCircle, ChevronUp, ChevronDown, Check } from 'lucide-react';

interface DailyLogFormProps {
  batchId: string;
}

const DEFAULT_BULTO_PRICES: Record<string, number> = {
  ITALCOL_DORADA: 125000,
  ITALCOL_AMARILLA: 115000,
  FINCA: 110000,
};

export function DailyLogForm({ batchId }: DailyLogFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [mortality, setMortality] = useState('');
  const [feedBrand, setFeedBrand] = useState('ITALCOL_DORADA');
  const [feedStage, setFeedStage] = useState('Iniciación');
  const [entryMode, setEntryMode] = useState<'bultos' | 'kilos'>('bultos');
  const [bultos, setBultos] = useState('0'); // Inicia en 0 para no forzar alimento si es solo baja
  const [manualKg, setManualKg] = useState('');
  const [feedCost, setFeedCost] = useState<string>('0');

  useEffect(() => {
    if (entryMode === 'bultos') {
      const pricePerBulto = DEFAULT_BULTO_PRICES[feedBrand] || 115000;
      const bultosNum = parseFloat(bultos) || 0;
      setFeedCost(bultosNum > 0 ? Math.round(bultosNum * pricePerBulto).toString() : '0');
    } else {
      const kgNum = parseFloat(manualKg) || 0;
      if (kgNum <= 0) setFeedCost('0');
    }
  }, [feedBrand, entryMode, bultos, manualKg]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('batchId', batchId);
    formData.append('mortalityCount', mortality || '0');
    formData.append('feedBrand', feedBrand);
    formData.append('feedStage', feedStage);
    formData.append('entryMode', entryMode);
    formData.append('bultos', bultos || '0');
    formData.append('manualKg', manualKg || '0');
    formData.append('feedCost', feedCost || '0');

    startTransition(async () => {
      try {
        await addDailyLog(formData);
        setMortality('');
        setManualKg('');
        setBultos('0');
        setFeedCost('0');
        setIsOpen(false);
      } catch (err) {
        console.error('Error al guardar novedad:', err);
      }
    });
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 text-amber-900 rounded-lg text-xs font-bold transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-amber-600" />
          Registrar Consumo y Bajas del Día
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-amber-700" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-700" />
        )}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Bajas (Aves)</label>
              <input
                type="number"
                value={mortality}
                onChange={(e) => setMortality(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Marca Concentrado</label>
              <select
                value={feedBrand}
                onChange={(e) => setFeedBrand(e.target.value)}
                className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-800"
              >
                <option value="ITALCOL_DORADA">Italcol Dorada</option>
                <option value="ITALCOL_AMARILLA">Italcol Amarilla</option>
                <option value="FINCA">Finca</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Etapa</label>
              <select
                value={feedStage}
                onChange={(e) => setFeedStage(e.target.value)}
                className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Preinicio">Preinicio</option>
                <option value="Iniciación">Iniciación</option>
                <option value="Engorde">Engorde / Ceba</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Presentación</label>
              <select
                value={entryMode}
                onChange={(e) => setEntryMode(e.target.value as 'bultos' | 'kilos')}
                className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="bultos">Bultos (40kg)</option>
                <option value="kilos">Kilos sueltos</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                {entryMode === 'bultos' ? 'Cantidad Bultos' : 'Kilos Servidos'}
              </label>
              {entryMode === 'bultos' ? (
                <select
                  value={bultos}
                  onChange={(e) => setBultos(e.target.value)}
                  className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="0">0 btos (Sin alimento)</option>
                  <option value="0.5">1/2 bto (20 Kg)</option>
                  <option value="1">1 bto (40 Kg)</option>
                  <option value="1.5">1.5 btos (60 Kg)</option>
                  <option value="2">2 btos (80 Kg)</option>
                </select>
              ) : (
                <input
                  type="number"
                  step="0.1"
                  value={manualKg}
                  onChange={(e) => setManualKg(e.target.value)}
                  placeholder="0 Kg"
                  min="0"
                  className="w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                Valor Total ($)
              </label>
              <input
                type="number"
                value={feedCost}
                onChange={(e) => setFeedCost(e.target.value)}
                placeholder="0"
                className="w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isPending ? 'Guardando...' : 'Guardar Novedad'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}