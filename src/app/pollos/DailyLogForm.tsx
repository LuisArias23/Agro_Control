'use client';

import { useState, useEffect, useTransition } from 'react';
import { addDailyLog } from './actions';

interface DailyLogFormProps {
  batchId: string;
}

// Precios de referencia por bulto completo (40 kg)
const DEFAULT_BULTO_PRICES: Record<string, number> = {
  ITALCOL_DORADA: 125000,
  ITALCOL_AMARILLA: 115000,
  FINCA: 110000,
};

export function DailyLogForm({ batchId }: DailyLogFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mortality, setMortality] = useState('');
  const [feedBrand, setFeedBrand] = useState('ITALCOL_DORADA');
  const [feedStage, setFeedStage] = useState('Iniciación');
  const [entryMode, setEntryMode] = useState<'bultos' | 'kilos'>('bultos');
  const [bultos, setBultos] = useState('1');
  const [manualKg, setManualKg] = useState('');
  // Valor neto en pesos
  const [feedCost, setFeedCost] = useState<string>('125000');

  // Si está en modo bulto, autocalcula el valor sugerido según la cantidad de bultos
  useEffect(() => {
    if (entryMode === 'bultos') {
      const pricePerBulto = DEFAULT_BULTO_PRICES[feedBrand] || 115000;
      const bultosNum = parseFloat(bultos) || 0;
      setFeedCost(Math.round(bultosNum * pricePerBulto).toString());
    } else {
      // Si pasa a kilos sueltos, deja que el usuario escriba la plata que pagó o 0
      setFeedCost('');
    }
  }, [feedBrand, entryMode, bultos]);

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
      } catch (err) {
        console.error('Error al guardar novedad:', err);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {/* 1. Bajas */}
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

        {/* 2. Marca */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Marca Alimento</label>
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

        {/* 3. Etapa */}
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

        {/* 4. Modo */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Presentación</label>
          <select
            value={entryMode}
            onChange={(e) => setEntryMode(e.target.value as 'bultos' | 'kilos')}
            className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="bultos">Por Bultos</option>
            <option value="kilos">Kilos sueltos</option>
          </select>
        </div>

        {/* 5. Cantidad */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
            {entryMode === 'bultos' ? 'Cantidad' : 'Kilos'}
          </label>
          {entryMode === 'bultos' ? (
            <select
              value={bultos}
              onChange={(e) => setBultos(e.target.value)}
              className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
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
              placeholder="Ej: 5 Kg"
              min="0"
              className="w-full text-xs px-2 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
          )}
        </div>

        {/* 6. Valor Neto Total ($) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
            Valor Total ($)
          </label>
          <input
            type="number"
            value={feedCost}
            onChange={(e) => setFeedCost(e.target.value)}
            placeholder="Ej: 15000 o 115000"
            className="w-full text-xs px-2.5 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-semibold text-slate-900"
          />
        </div>

        {/* 7. Botón Guardar */}
        <div className="flex items-end col-span-2 sm:col-span-1">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium text-xs py-2 rounded-lg transition h-[35px] cursor-pointer flex items-center justify-center shadow-sm"
          >
            {isPending ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}