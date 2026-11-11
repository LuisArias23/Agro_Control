'use client';

import { useState, useTransition } from 'react';
import { Waves, Scale, ShoppingBag, PlusCircle, X, Check } from 'lucide-react';
import { addFishDailyLog, addFishSampling, addFishHarvest } from './actions';

interface FishModalsProps {
  batchId: string;
  pondCode: string;
  currentQuantity: number;
  currentAvgWeight: number;
}

export function FishModals({ batchId, pondCode, currentQuantity, currentAvgWeight }: FishModalsProps) {
  const [openModal, setOpenModal] = useState<'feed' | 'sampling' | 'harvest' | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados de Alimentación
  const [entryMode, setEntryMode] = useState<'bultos' | 'kilos'>('kilos');
  const [manualKg, setManualKg] = useState('');
  const [bultos, setBultos] = useState('0');
  const [feedCost, setFeedCost] = useState('');

  // Estados de Cosecha
  const [harvestKg, setHarvestKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('11000'); // Precio sugerido local

  const handleDailySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addFishDailyLog(formData);
      setOpenModal(null);
    });
  };

  const handleSamplingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addFishSampling(formData);
      setOpenModal(null);
    });
  };

  const handleHarvestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addFishHarvest(formData);
      setOpenModal(null);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setOpenModal('feed')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition cursor-pointer"
      >
        <Waves className="w-3.5 h-3.5 text-amber-700" />
        Alimentación / Bajas
      </button>

      <button
        type="button"
        onClick={() => setOpenModal('sampling')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-lg transition cursor-pointer"
      >
        <Scale className="w-3.5 h-3.5 text-sky-700" />
        Muestreo Biometría
      </button>

      <button
        type="button"
        onClick={() => setOpenModal('harvest')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition cursor-pointer"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        Cosecha y Ventas
      </button>

      {/* MODAL 1: ALIMENTACIÓN Y BAJAS */}
      {openModal === 'feed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Alimentación Diaria: {pondCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDailySubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bajas (Peces muertos)</label>
                  <input type="number" name="mortalityCount" placeholder="0" min="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">% Proteína Alimento</label>
                  <select name="proteinPercentage" defaultValue="32" className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium">
                    <option value="45">45% (Alevinaje)</option>
                    <option value="38">38% (Iniciación)</option>
                    <option value="32">32% (Levante)</option>
                    <option value="28">28% / 24% (Engorde/Final)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Marca Concentrado</label>
                  <input type="text" name="feedBrand" defaultValue="Italcol Peces" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Presentación</label>
                  <select value={entryMode} onChange={(e) => setEntryMode(e.target.value as any)} className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white">
                    <option value="kilos">Kilos sueltos</option>
                    <option value="bultos">Bultos (40 Kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {entryMode === 'kilos' ? 'Kilos Servidos' : 'Cantidad Bultos'}
                  </label>
                  {entryMode === 'kilos' ? (
                    <input type="number" step="0.1" name="manualKg" placeholder="0 Kg" className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold" />
                  ) : (
                    <select name="bultos" defaultValue="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white">
                      <option value="0">0 btos (Sin alimento)</option>
                      <option value="0.5">1/2 bto (20 Kg)</option>
                      <option value="1">1 bto (40 Kg)</option>
                      <option value="2">2 btos (80 Kg)</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Costo Alimento ($)</label>
                  <input type="number" name="feedCost" placeholder="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-semibold" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Notas (Parámetros agua, sal marina, etc.)</label>
                <input type="text" name="notes" placeholder="Ej: Agua verde clara, aireador encendido" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MUESTREO BIOMÉTRICO */}
      {openModal === 'sampling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Muestreo de Peso: {pondCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSamplingSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Peso Promedio por Pez (Gramos)</label>
                <input
                  type="number"
                  step="0.1"
                  name="avgWeightGrams"
                  placeholder="Ej: 350.5"
                  required
                  defaultValue={currentAvgWeight > 0 ? currentAvgWeight : ''}
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-sky-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Peces Muestreados</label>
                  <input type="number" name="sampleCount" defaultValue="20" min="1" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Detalle Malla</label>
                  <input type="text" name="notes" placeholder="Muestreo quincenal" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Actualizar Biometría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: COSECHA Y VENTA */}
      {openModal === 'harvest' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Registrar Cosecha / Venta: {pondCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleHarvestSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Kilos Totales Cosechados</label>
                  <input
                    type="number"
                    step="0.1"
                    name="totalKg"
                    value={harvestKg}
                    onChange={(e) => setHarvestKg(e.target.value)}
                    placeholder="0.0"
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold text-emerald-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Número de Peces Sacados</label>
                  <input type="number" name="fishCount" placeholder="Ej: 50" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Precio por Kilo ($)</label>
                  <input
                    type="number"
                    step="100"
                    name="pricePerKg"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Total Venta Estimada</label>
                  <div className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-slate-100 font-bold text-emerald-800">
                    ${((parseFloat(harvestKg) || 0) * (parseFloat(pricePerKg) || 0)).toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cliente / Comprador</label>
                  <input type="text" name="customer" placeholder="Ej: Restaurante, Mayorista" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Estado de Pago</label>
                  <select name="paymentStatus" defaultValue="PAGADO" className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold">
                    <option value="PAGADO">Pagado de Contado</option>
                    <option value="FIADO">Pendiente (Fiado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs">
                  <Check className="w-3.5 h-3.5" /> Registrar Cosecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}