'use client';

import { useState, useTransition } from 'react';
import { Utensils, Scale, ShoppingBag, X, Check } from 'lucide-react';
import { addSwineDailyLog, addSwineSampling, addSwineSale } from './actions';

interface SwineModalsProps {
  batchId: string;
  batchCode: string;
  stage: 'DESTETE_PRECEBO' | 'CEBA_ENGORDE' | string;
  currentQuantity: number;
  currentAvgWeight: number;
}

export function SwineModals({ batchId, batchCode, stage, currentQuantity, currentAvgWeight }: SwineModalsProps) {
  const [openModal, setOpenModal] = useState<'feed' | 'sampling' | 'sale' | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados Alimentación
  const [entryMode, setEntryMode] = useState<'bultos' | 'kilos'>('kilos');

  // Estados Venta
  const [totalWeightKg, setTotalWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState(stage === 'DESTETE_PRECEBO' ? '12000' : '9500');
  const [pigsSold, setPigsSold] = useState('1');

  const computedTotal = (parseFloat(totalWeightKg) || 0) * (parseFloat(pricePerKg) || 0);

  const handleDailySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addSwineDailyLog(formData);
      setOpenModal(null);
    });
  };

  const handleSamplingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addSwineSampling(formData);
      setOpenModal(null);
    });
  };

  const handleSaleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addSwineSale(formData);
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
        <Utensils className="w-3.5 h-3.5 text-amber-700" />
        Alimento / Bajas
      </button>

      <button
        type="button"
        onClick={() => setOpenModal('sampling')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg transition cursor-pointer"
      >
        <Scale className="w-3.5 h-3.5 text-rose-600" />
        Pesaje ({stage === 'DESTETE_PRECEBO' ? 'Precebo' : 'Ceba'})
      </button>

      <button
        type="button"
        onClick={() => setOpenModal('sale')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition cursor-pointer"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        Venta / Despacho
      </button>

      {/* MODAL 1: ALIMENTACIÓN */}
      {openModal === 'feed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Alimentación: {batchCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDailySubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Etapa / Dieta</label>
                  <select
                    name="feedPhase"
                    defaultValue={stage === 'DESTETE_PRECEBO' ? 'PREINICIACION' : 'LEVANTE'}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  >
                    <option value="PREINICIACION">Preiniciación (Lechones)</option>
                    <option value="INICIACION">Iniciación</option>
                    <option value="LEVANTE">Levante</option>
                    <option value="ENGORDE">Engorde / Ceba Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bajas (Muertes)</label>
                  <input type="number" name="mortalityCount" placeholder="0" min="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Modo de Ingreso</label>
                  <select value={entryMode} onChange={(e) => setEntryMode(e.target.value as any)} className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white">
                    <option value="kilos">Kilos servidos</option>
                    <option value="bultos">Bultos (40 Kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {entryMode === 'kilos' ? 'Kilos Servidos' : 'Bultos'}
                  </label>
                  {entryMode === 'kilos' ? (
                    <input type="number" step="0.5" name="manualKg" placeholder="Ej: 15 Kg" required className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold" />
                  ) : (
                    <select name="bultos" defaultValue="1" className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold">
                      <option value="0.5">1/2 bto (20 Kg)</option>
                      <option value="1">1 bto (40 Kg)</option>
                      <option value="2">2 btos (80 Kg)</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Costo Alimento ($)</label>
                <input type="number" name="feedCost" placeholder="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-semibold" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Notas / Dieta</label>
                <input type="text" name="notes" placeholder="Ej: Suero, papilla para destete, desparasitante" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PESAJE */}
      {openModal === 'sampling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Pesaje: {batchCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSamplingSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Peso Promedio por Cerdo (Kilos)</label>
                <input
                  type="number"
                  step="0.1"
                  name="avgWeightKg"
                  placeholder="Ej: 18.5"
                  required
                  defaultValue={currentAvgWeight > 0 ? currentAvgWeight : ''}
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-rose-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Muestreados (Und)</label>
                  <input type="number" name="sampleCount" defaultValue="4" min="1" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Notas</label>
                  <input type="text" name="notes" placeholder="Pesaje quincenal" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Actualizar Pesaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VENTA / DESPACHO */}
      {openModal === 'sale' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Venta / Despacho: {batchCode}</h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cantidad Cerdos</label>
                  <input
                    type="number"
                    name="pigsSold"
                    value={pigsSold}
                    onChange={(e) => setPigsSold(e.target.value)}
                    min="1"
                    max={currentQuantity}
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Destino / Tipo</label>
                  <select
                    name="saleType"
                    defaultValue={stage === 'DESTETE_PRECEBO' ? 'LECHON_DESTETADO' : 'EN_PIE'}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  >
                    {stage === 'DESTETE_PRECEBO' ? (
                      <>
                        <option value="LECHON_DESTETADO">Lechón Destetado (Cría externa)</option>
                        <option value="EN_PIE">En Pie (Kilo vivo)</option>
                      </>
                    ) : (
                      <>
                        <option value="EN_PIE">En Pie (Báscula)</option>
                        <option value="CANAL">En Canal (Faenado)</option>
                        <option value="DESTINO_CHORIZOS">Para Chorizos (Interno)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Kilos Totales</label>
                  <input
                    type="number"
                    step="0.1"
                    name="totalWeightKg"
                    value={totalWeightKg}
                    onChange={(e) => setTotalWeightKg(e.target.value)}
                    placeholder="Ej: 95.0"
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold text-emerald-950"
                  />
                </div>
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
              </div>

              <div className="p-2.5 bg-slate-50 border rounded-lg flex items-center justify-between">
                <span className="text-xs text-slate-500">Valor Total Venta:</span>
                <span className="text-sm font-black text-emerald-800">${Math.round(computedTotal).toLocaleString('es-CO')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Forma de Pago</label>
                  <select name="paymentStatus" defaultValue="PAGADO" className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold">
                    <option value="PAGADO">Contado</option>
                    <option value="FIADO">Fiado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cliente</label>
                  <input type="text" name="customer" placeholder="Ej: Carnicería / Vecino" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}