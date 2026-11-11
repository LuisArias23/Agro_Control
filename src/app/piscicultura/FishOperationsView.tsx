'use client';

import { useState, useTransition } from 'react';
import { Fish, ShoppingBag, PlusCircle, Check, Scale } from 'lucide-react';
import { registerFishHarvest, registerFishSale } from '../../app/piscicultura/actions';

interface BatchOption {
  id: string;
  pondCode: string;
  currentQuantity: number;
}

export function FishOperationsView({
  batches,
  availableKgInCooler,
}: {
  batches: BatchOption[];
  availableKgInCooler: number;
}) {
  const [activeTab, setActiveTab] = useState<'venta' | 'saca'>('venta');
  const [isPending, startTransition] = useTransition();

  // Estados Saca General
  const [sacaBatchId, setSacaBatchId] = useState(batches[0]?.id || '');

  // Estados Venta Mostrador
  const [saleFormat, setSaleFormat] = useState<'DETAL' | 'MAYOR'>('DETAL');
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LIBRAS'>('KG');
  const [rawWeight, setRawWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState('13000');
  const [customer, setCustomer] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAGADO');

  const numericWeight = parseFloat(rawWeight) || 0;
  const computedKg = weightUnit === 'LIBRAS' ? numericWeight * 0.5 : numericWeight;
  const computedPricePerKg = parseFloat(pricePerKg) || 0;
  const totalAmount = computedKg * computedPricePerKg;

  const handleSacaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', sacaBatchId);

    startTransition(async () => {
      await registerFishHarvest(formData);
      (e.target as HTMLFormElement).reset();
      setActiveTab('venta'); // Pasa directo a vender
    });
  };

  const handleSaleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (computedKg <= 0) return;

    const formData = new FormData();
    formData.append('saleFormat', saleFormat);
    formData.append('kgSold', computedKg.toFixed(2));
    formData.append('pricePerKg', pricePerKg);
    formData.append('paymentStatus', paymentStatus);
    formData.append('customer', customer);

    startTransition(async () => {
      await registerFishSale(formData);
      setRawWeight('');
      setCustomer('');
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24 space-y-4">
      {/* Selector de modo */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('venta')}
          className={`py-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'venta' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Venta al Detal/Mayor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saca')}
          className={`py-2 rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'saca' ? 'bg-sky-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Fish className="w-3.5 h-3.5" /> Saca de Estanque
        </button>
      </div>

      {/* PESTAÑA 1: VENTA AL DETAL / MAYOR */}
      {activeTab === 'venta' && (
        <form onSubmit={handleSaleSubmit} className="space-y-3.5">
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-950">Disponible en Cava:</span>
            <span className="text-sm font-black text-emerald-950">{availableKgInCooler.toFixed(1)} Kg</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Modalidad:</span>
            <div className="flex gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setSaleFormat('DETAL');
                  setPricePerKg('13000');
                }}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  saleFormat === 'DETAL' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-500'
                }`}
              >
                Detal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSaleFormat('MAYOR');
                  setPricePerKg('10000');
                }}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  saleFormat === 'MAYOR' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-500'
                }`}
              >
                Mayor
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">Peso Despachado</label>
              <div className="flex gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setWeightUnit('KG')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    weightUnit === 'KG' ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'text-slate-500'
                  }`}
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit('LIBRAS')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    weightUnit === 'LIBRAS' ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'text-slate-500'
                  }`}
                >
                  LIBRAS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  step="0.05"
                  value={rawWeight}
                  onChange={(e) => setRawWeight(e.target.value)}
                  placeholder={weightUnit === 'KG' ? 'Ej: 1.5' : 'Ej: 3'}
                  required
                  min="0.05"
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-slate-900"
                />
                {weightUnit === 'LIBRAS' && numericWeight > 0 && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                    = {computedKg.toFixed(2)} Kg
                  </span>
                )}
              </div>
              <div>
                <input
                  type="number"
                  step="100"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg font-semibold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Precio/Kg</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border rounded-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">Total a Cobrar:</span>
            <span className="text-base font-black text-emerald-800">
              ${Math.round(totalAmount).toLocaleString('es-CO')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pago</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
              >
                <option value="PAGADO">Contado / Nequi</option>
                <option value="FIADO">Fiado</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cliente</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Registrar Venta'}
          </button>
        </form>
      )}

      {/* PESTAÑA 2: REGISTRAR SACA / COSECHA GENERAL */}
      {activeTab === 'saca' && (
        <form onSubmit={handleSacaSubmit} className="space-y-3.5">
          <p className="text-xs text-slate-500">
            Registra los peces que sacaste del estanque una vez arreglados y descamados para pasarlos a la cava.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Estanque de Origen</label>
            <select
              value={sacaBatchId}
              onChange={(e) => setSacaBatchId(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-medium"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.pondCode} ({b.currentQuantity} peces vivos)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kilos Obtenidos (Arreglados)
              </label>
              <input
                type="number"
                step="0.1"
                name="totalKg"
                placeholder="Ej: 18.5"
                required
                className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-sky-950"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Peces Sacados (Und)
              </label>
              <input
                type="number"
                name="fishCount"
                placeholder="Ej: 40"
                required
                className="w-full text-xs px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notas de la Jornada</label>
            <input
              type="text"
              name="notes"
              placeholder="Ej: Saca matutina, eviscerado y con hielo"
              className="w-full text-xs px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || batches.length === 0}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Ingresar a Cava'}
          </button>
        </form>
      )}
    </div>
  );
}