'use client';

import { useState, useTransition } from 'react';
import { ShoppingBag, Check, Scale } from 'lucide-react';
import { addFishHarvest } from '../actions';

interface BatchOption {
  id: string;
  pondCode: string;
  species: string;
  currentQuantity: number;
  currentAvgWeight: number;
}

export function FishSaleForm({ batches }: { batches: BatchOption[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [saleCategory, setSaleCategory] = useState<'DETAL' | 'MAYOR'>('DETAL');
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LIBRAS'>('KG');
  const [rawWeight, setRawWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState('13000'); // Sugerido detal
  const [fishCount, setFishCount] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAGADO');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  // Si digita en libras, convertimos a Kg para almacenar de forma estándar (1 Lb = 0.5 Kg o 0.4536 Kg comercial)
  const numericWeight = parseFloat(rawWeight) || 0;
  const computedKg = weightUnit === 'LIBRAS' ? numericWeight * 0.5 : numericWeight;
  const computedPricePerKg = parseFloat(pricePerKg) || 0;
  const totalAmount = computedKg * computedPricePerKg;

  const handleCategoryChange = (category: 'DETAL' | 'MAYOR') => {
    setSaleCategory(category);
    setPricePerKg(category === 'DETAL' ? '13000' : '10000');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBatchId || computedKg <= 0) return;

    const formData = new FormData();
    formData.append('batchId', selectedBatchId);
    formData.append('totalKg', computedKg.toFixed(2));
    formData.append('pricePerKg', pricePerKg);
    formData.append('fishCount', fishCount || '0');
    formData.append('paymentStatus', paymentStatus);
    formData.append('customer', customer || (saleCategory === 'DETAL' ? 'Cliente Detal' : 'Mayorista'));
    formData.append('notes', notes ? `[${saleCategory}] ${notes}` : `[${saleCategory}]`);

    startTransition(async () => {
      await addFishHarvest(formData);
      setRawWeight('');
      setFishCount('');
      setCustomer('');
      setNotes('');
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-700" />
          Registrar Venta
        </h2>

        {/* Selector Detal vs Mayor */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleCategoryChange('DETAL')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              saleCategory === 'DETAL' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Al Detal
          </button>
          <button
            type="button"
            onClick={() => handleCategoryChange('MAYOR')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              saleCategory === 'MAYOR' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Al Mayor
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Estanque de Origen
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-medium"
            required
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.pondCode} ({b.currentQuantity} peces vivientes - ~{b.currentAvgWeight}g)
              </option>
            ))}
          </select>
        </div>

        {/* Control de Peso con Unidad (Kg / Libras) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-600">
              Peso Despachado
            </label>
            <div className="flex gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setWeightUnit('KG')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  weightUnit === 'KG' ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'text-slate-500'
                }`}
              >
                KILOS
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
                placeholder={weightUnit === 'KG' ? 'Ej: 2.5 Kg' : 'Ej: 5 Lbs'}
                required
                min="0.05"
                className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-emerald-950"
              />
              {weightUnit === 'LIBRAS' && numericWeight > 0 && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Equivale a: <strong>{computedKg.toFixed(2)} Kg</strong>
                </span>
              )}
            </div>

            <div>
              <input
                type="number"
                step="100"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                placeholder="Precio/Kg"
                required
                className="w-full text-xs px-3 py-2 border rounded-lg font-semibold"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Precio por Kilo</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Peces Sacados (Und)
            </label>
            <input
              type="number"
              value={fishCount}
              onChange={(e) => setFishCount(e.target.value)}
              placeholder="Ej: 3"
              min="0"
              className="w-full text-xs px-2.5 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Valor a Cobrar ($)
            </label>
            <div className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-emerald-50/60 font-black text-emerald-900">
              ${Math.round(totalAmount).toLocaleString('es-CO')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Forma de Pago
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
            >
              <option value="PAGADO">Contado (Efectivo / Nequi)</option>
              <option value="FIADO">Fiado (Por cobrar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Cliente / Comprador
            </label>
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
          disabled={isPending || batches.length === 0}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          <Check className="w-4 h-4" />
          {isPending ? 'Guardando...' : `Registrar Venta (${saleCategory})`}
        </button>
      </form>
    </div>
  );
}