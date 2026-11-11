'use client';

import { useState, useTransition } from 'react';
import {
  Heart,
  Baby,
  Sparkles,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  Utensils,
  ShoppingBag,
  X,
  Check,
  Pencil,
} from 'lucide-react';
import {
  createSwineSow,
  registerMating,
  registerFarrowing,
  registerWeaningAndCreateBatch,
  promoteToCeba,
  closeSwineBatch,
  addSwineDailyLog,
  addSwineSale,
  updateSwineBatch,
} from './actions';

interface SowItem {
  id: string;
  code: string;
  breed: string | null;
  status: string;
  entryDate: string;
  farrowings: {
    id: string;
    matingDate: string | null;
    expectedDate: string | null;
    farrowingDate: string | null;
    bornAlive: number;
    bornDead: number;
    weanedCount: number | null;
  }[];
}

interface BatchItem {
  id: string;
  batchCode: string;
  stage: string;
  startDate: string;
  initialQuantity: number;
  currentQuantity: number;
  initialAvgWeight: number;
  currentAvgWeight: number;
  purchaseCostTotal: number;
  origin: string;
  dailyLogs: {
    mortalityCount: number;
    feedKgServed: number;
    feedCost: number;
  }[];
  sales: {
    pigsSold: number;
    totalPrice: number;
  }[];
}

export function SwineTabsView({ sows, batches }: { sows: SowItem[]; batches: BatchItem[] }) {
  const [activeTab, setActiveTab] = useState<'PARIDERAS' | 'DESTETE' | 'CEBA'>('DESTETE');
  const [isPending, startTransition] = useTransition();

  // Modales Reproducción (Cerdas)
  const [matingSowId, setMatingSowId] = useState<string | null>(null);
  const [farrowingSow, setFarrowingSow] = useState<{ sowId: string; farrowingId?: string } | null>(null);
  const [weaningSow, setWeaningSow] = useState<{ sowId: string; farrowingId?: string } | null>(null);

  // Modales Lotes (Edición, Comida, Ventas)
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);
  const [activeLogBatch, setActiveLogBatch] = useState<BatchItem | null>(null);
  const [activeSaleBatch, setActiveSaleBatch] = useState<BatchItem | null>(null);

  // Estados Formulario de Venta
  const [pigsSold, setPigsSold] = useState('1');
  const [totalWeightKg, setTotalWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('9500');
  const computedTotalSale = (parseFloat(totalWeightKg) || 0) * (parseFloat(pricePerKg) || 0);

  const weanedBatches = batches.filter((b) => b.stage === 'DESTETE_PRECEBO');
  const cebaBatches = batches.filter((b) => b.stage === 'CEBA_ENGORDE');

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="grid grid-cols-3 p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('PARIDERAS')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'PARIDERAS'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          1. Cerdas Parideras ({sows.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DESTETE')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'DESTETE'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Baby className="w-4 h-4" />
          2. Lechones Destete ({weanedBatches.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CEBA')}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'CEBA'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Cerdos de Ceba ({cebaBatches.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. CERDAS PARIDERAS */}
      {/* ============================================================== */}
      {activeTab === 'PARIDERAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs sticky top-24">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <PlusCircle className="w-4 h-4 text-rose-600" />
                Registrar Cerda Paridera
              </h2>
              <form
                action={async (formData) => {
                  startTransition(async () => {
                    await createSwineSow(formData);
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre o Número</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="Ej: CERDA-01 / La Manchada"
                    required
                    className="w-full text-xs px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Raza</label>
                  <input
                    type="text"
                    name="breed"
                    defaultValue="Landrace x Pietrain (F1)"
                    className="w-full text-xs px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Estado Inicial</label>
                  <select name="status" defaultValue="VACIA" className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-medium">
                    <option value="VACIA">Vacía (Lista para monta)</option>
                    <option value="GESTANTE">Preñada / Gestante</option>
                    <option value="LACTANDO">Parida / Lactando</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs cursor-pointer"
                >
                  {isPending ? 'Guardando...' : 'Guardar Cerda'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Plantel de Reproductoras ({sows.length})</h2>

            {sows.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50 text-rose-500" />
                <p className="text-xs font-medium">No hay cerdas registradas aún.</p>
              </div>
            ) : (
              sows.map((sow) => {
                const activeFarrowing = sow.farrowings[0];
                let daysGestation = 0;
                let daysLeft = 0;

                if (activeFarrowing?.matingDate && sow.status === 'GESTANTE') {
                  const mTime = new Date(activeFarrowing.matingDate).getTime();
                  const now = new Date().getTime();
                  daysGestation = Math.max(0, Math.floor((now - mTime) / (1000 * 60 * 60 * 24)));
                  daysLeft = Math.max(0, 114 - daysGestation);
                }

                return (
                  <div key={sow.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{sow.code}</h3>
                          <span className="text-[11px] text-slate-500">({sow.breed || 'Sin raza'})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Ingreso: {new Date(sow.entryDate).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          sow.status === 'GESTANTE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : sow.status === 'LACTANDO'
                            ? 'bg-sky-100 text-sky-900 border border-sky-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {sow.status === 'GESTANTE'
                          ? 'PREÑADA'
                          : sow.status === 'LACTANDO'
                          ? 'PARIDA / LACTANDO'
                          : 'VACÍA'}
                      </span>
                    </div>

                    {sow.status === 'GESTANTE' && (
                      <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Día Gestación</span>
                          <strong className="text-amber-950 font-black">{daysGestation} / 114 días</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Faltan para Parto</span>
                          <strong className="text-amber-950 font-black">{daysLeft} días</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Fecha Estimada</span>
                          <strong className="text-amber-950">
                            {activeFarrowing?.expectedDate
                              ? new Date(activeFarrowing.expectedDate).toLocaleDateString()
                              : 'Calculando...'}
                          </strong>
                        </div>
                      </div>
                    )}

                    {sow.status === 'LACTANDO' && (
                      <div className="p-3 bg-sky-50/70 rounded-lg border border-sky-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Camada amamantando</span>
                          <strong className="text-sky-950 font-black text-sm">
                            {activeFarrowing ? `${activeFarrowing.bornAlive} lechones vivos` : 'Camada activa'}
                          </strong>
                        </div>
                        {activeFarrowing?.farrowingDate && (
                          <span className="text-sky-800 text-[11px]">
                            Parto: {new Date(activeFarrowing.farrowingDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      {sow.status === 'VACIA' && (
                        <button
                          type="button"
                          onClick={() => setMatingSowId(sow.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition cursor-pointer"
                        >
                          Registrar Monta (Preñez)
                        </button>
                      )}

                      {sow.status === 'GESTANTE' && (
                        <button
                          type="button"
                          onClick={() =>
                            setFarrowingSow({ sowId: sow.id, farrowingId: activeFarrowing?.id })
                          }
                          className="px-3 py-1.5 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Registrar Parto
                        </button>
                      )}

                      {sow.status === 'LACTANDO' && (
                        <button
                          type="button"
                          onClick={() =>
                            setWeaningSow({ sowId: sow.id, farrowingId: activeFarrowing?.id })
                          }
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Destetar y Trasladar Camada a Precebo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LECHONES DESTETE (PRECEBO) */}
      {/* ============================================================== */}
      {activeTab === 'DESTETE' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Lechones en Destete / Precebo ({weanedBatches.length})</h2>
            <p className="text-xs text-slate-500">Camadas en preiniciación e iniciación (6 a 25 Kg) con costo acumulado</p>
          </div>

          {weanedBatches.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
              <Baby className="w-8 h-8 mx-auto mb-2 opacity-50 text-amber-600" />
              <p className="text-xs font-medium">No hay lechones en destete actualmente.</p>
            </div>
          ) : (
            weanedBatches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const daysInPrecebo = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
              const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const totalInvested = Number(batch.purchaseCostTotal) + totalFeedCost;

              const costPerPig = batch.currentQuantity > 0 ? Math.round(totalInvested / batch.currentQuantity) : 0;
              const currentAvgWeight = Number(batch.currentAvgWeight);
              const totalBiomassKg = batch.currentQuantity * currentAvgWeight;
              const costPerKg = totalBiomassKg > 0 ? Math.round(totalInvested / totalBiomassKg) : 0;

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{batch.batchCode}</h3>
                        <button
                          type="button"
                          onClick={() => setEditingBatch(batch)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                          title="Editar corral, lechones y costo inicial"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          PRECEBO
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Día {daysInPrecebo} de destete
                        </span>
                        <span className="text-[11px] text-slate-400">({batch.origin})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Destetados el: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Promover el lote ${batch.batchCode} a Ceba / Engorde?`)) {
                          startTransition(async () => {
                            await promoteToCeba(batch.id);
                          });
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      Pasar a Ceba <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Lechones Vivos</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">{totalMortality} bajas</span>
                    </div>

                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                      <span className="text-xs text-amber-950 font-semibold">Peso Promedio</span>
                      <p className="text-base font-black text-amber-950">{currentAvgWeight} Kg</p>
                      <span className="text-[10px] text-amber-800 block mt-0.5">{totalBiomassKg.toFixed(1)} Kg en corral</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Comida Servida</span>
                      <p className="text-base font-bold text-slate-900">{totalFeedKg.toFixed(1)} Kg</p>
                      <span className="text-[10px] text-amber-700 block mt-0.5">${totalFeedCost.toLocaleString('es-CO')}</span>
                    </div>

                    <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
                      <span className="text-xs font-bold text-rose-950">Costo / Lechón</span>
                      <p className="text-base font-black text-rose-950">
                        ${costPerPig.toLocaleString('es-CO')}
                      </p>
                      <span className="text-[10px] text-rose-800 block mt-0.5">
                        Inversión: ${totalInvested.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-950">Costo por Kg</span>
                      <p className="text-base font-black text-emerald-950">
                        {costPerKg > 0 ? `$${costPerKg.toLocaleString('es-CO')}` : '-'}
                      </p>
                      <span className="text-[10px] text-emerald-800 block mt-0.5">
                        Base de venta en pie
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveLogBatch(batch)}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Registrar Comida / Bajas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSaleBatch(batch);
                        setPricePerKg('12000');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Vender Lechones
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CERDOS DE CEBA / ENGORDE */}
      {/* ============================================================== */}
      {activeTab === 'CEBA' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Corrales de Ceba y Engorde ({cebaBatches.length})</h2>
            <p className="text-xs text-slate-500">Cerdos en engorde intensivo (25 a 105 Kg) para báscula o beneficio</p>
          </div>

          {cebaBatches.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-600" />
              <p className="text-xs font-medium">No hay lotes en ceba activa actualmente.</p>
            </div>
          ) : (
            cebaBatches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
              const totalInvested = Number(batch.purchaseCostTotal) + totalFeedCost;

              const totalSoldPigs = batch.sales.reduce((acc, s) => acc + s.pigsSold, 0);
              const totalRevenue = batch.sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);

              const currentAvgWeight = Number(batch.currentAvgWeight);
              const totalBiomassKg = batch.currentQuantity * currentAvgWeight;
              const costPerKg = totalBiomassKg > 0 ? Math.round(totalInvested / totalBiomassKg) : 0;
              const costPerPig = batch.currentQuantity > 0 ? Math.round(totalInvested / batch.currentQuantity) : 0;

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <button
                          type="button"
                          onClick={() => setEditingBatch(batch)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                          title="Editar corral, peso o inversión inicial"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-rose-100 text-rose-900 rounded-full">
                          Día {diffDays} de ceba
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {batch.origin}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ingresó: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Liquidar el lote ${batch.batchCode}?`)) {
                            startTransition(async () => {
                              await closeSwineBatch(batch.id);
                            });
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                        Liquidar Lote
                      </button>

                      <span className="text-xs font-bold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                        EN CEBA
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Cerdos Vivos</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">{totalMortality} bajas</span>
                    </div>

                    <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                      <span className="text-xs text-rose-950 font-semibold">Peso Promedio</span>
                      <p className="text-base font-black text-rose-950">{currentAvgWeight} Kg</p>
                      <span className="text-[10px] text-rose-700 block mt-0.5">{totalBiomassKg.toFixed(1)} Kg en pie</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Comida Servida</span>
                      <p className="text-base font-bold text-slate-900">{totalFeedKg.toFixed(1)} Kg</p>
                      <span className="text-[10px] text-amber-700 block mt-0.5">${totalFeedCost.toLocaleString('es-CO')}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Costo / Cerdo</span>
                      <p className="text-base font-bold text-slate-900">${costPerPig.toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Inv: ${totalInvested.toLocaleString('es-CO')}</span>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-950 font-semibold">Costo por Kg</span>
                      <p className="text-base font-black text-emerald-950">
                        {costPerKg > 0 ? `$${costPerKg.toLocaleString('es-CO')}` : '-'}
                      </p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Kilo vivo costo</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-950 font-semibold">Ventas Totales</span>
                      <p className="text-base font-black text-emerald-950">${totalRevenue.toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">{totalSoldPigs} cerdos</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveLogBatch(batch)}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Registrar Comida / Bajas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSaleBatch(batch);
                        setPricePerKg('9500');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Venta (En Pie / Canal)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR MONTA */}
      {/* ============================================================== */}
      {matingSowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Registrar Monta / Preñez</h3>
            <p className="text-xs text-slate-500">El sistema sumará 114 días para proyectar la fecha de parto.</p>
            <form
              action={async (formData) => {
                formData.append('sowId', matingSowId);
                startTransition(async () => {
                  await registerMating(formData);
                  setMatingSowId(null);
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Monta</label>
                <input
                  type="date"
                  name="matingDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setMatingSowId(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg cursor-pointer">
                  Guardar Preñez
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR PARTO */}
      {/* ============================================================== */}
      {farrowingSow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Registrar Parto</h3>
            <form
              action={async (formData) => {
                formData.append('sowId', farrowingSow.sowId);
                if (farrowingSow.farrowingId) formData.append('farrowingId', farrowingSow.farrowingId);

                startTransition(async () => {
                  await registerFarrowing(formData);
                  setFarrowingSow(null);
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del Parto</label>
                <input
                  type="date"
                  name="farrowingDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nacidos Vivos</label>
                  <input type="number" name="bornAlive" placeholder="10" min="0" required className="w-full text-xs px-3 py-2 border rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nacidos Muertos</label>
                  <input type="number" name="bornDead" defaultValue="0" min="0" className="w-full text-xs px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setFarrowingSow(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg cursor-pointer">
                  Guardar Parto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DESTETAR CAMADA (CON VALOR INICIAL) */}
      {/* ============================================================== */}
      {weaningSow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Destetar Camada</h3>
            <p className="text-xs text-slate-500">La cerda volverá a Vacía y se creará el lote con su costo de entrada.</p>
            <form
              action={async (formData) => {
                formData.append('sowId', weaningSow.sowId);
                if (weaningSow.farrowingId) formData.append('farrowingId', weaningSow.farrowingId);

                startTransition(async () => {
                  await registerWeaningAndCreateBatch(formData);
                  setWeaningSow(null);
                  setActiveTab('DESTETE');
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código de Lote o Corral</label>
                <input
                  type="text"
                  name="batchCode"
                  placeholder="Ej: DESTETE-CORRAL-1"
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lechones Destetados</label>
                  <input
                    type="number"
                    name="weanedCount"
                    placeholder="10"
                    min="1"
                    required
                    className="w-full text-xs px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peso Promedio (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weaningAvgWeight"
                    defaultValue="7.0"
                    className="w-full text-xs px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Base Inicial / Camada ($)</label>
                <input
                  type="number"
                  step="1000"
                  name="initialCostTotal"
                  defaultValue="0"
                  placeholder="0 si no asignas costo a la madre"
                  className="w-full text-xs px-3 py-2 border rounded-lg font-semibold text-rose-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setWeaningSow(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg cursor-pointer">
                  Completar Destete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR LOTE / COSTO INICIAL */}
      {/* ============================================================== */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Editar Lote</h3>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                formData.append('batchId', editingBatch.id);
                startTransition(async () => {
                  await updateSwineBatch(formData);
                  setEditingBatch(null);
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre o Código del Corral
                </label>
                <input
                  type="text"
                  name="batchCode"
                  defaultValue={editingBatch.batchCode}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cerdos Vivos
                  </label>
                  <input
                    type="number"
                    name="currentQuantity"
                    defaultValue={editingBatch.currentQuantity}
                    min="1"
                    required
                    className="w-full text-xs px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Peso Promedio (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="currentAvgWeight"
                    defaultValue={editingBatch.currentAvgWeight}
                    className="w-full text-xs px-3 py-2 border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Valor Base Inicial / Compra ($)
                </label>
                <input
                  type="number"
                  step="500"
                  name="purchaseCostTotal"
                  defaultValue={editingBatch.purchaseCostTotal}
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-rose-950"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ingresa el valor inicial del lote para calcular el costo real por lechón.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> {isPending ? 'Guardando...' : 'Actualizar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ALIMENTACIÓN */}
      {/* ============================================================== */}
      {activeLogBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Alimentación: {activeLogBatch.batchCode}</h3>
              <button onClick={() => setActiveLogBatch(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                formData.append('batchId', activeLogBatch.id);
                startTransition(async () => {
                  await addSwineDailyLog(formData);
                  setActiveLogBatch(null);
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Etapa / Concentrado</label>
                  <select
                    name="feedPhase"
                    defaultValue={activeLogBatch.stage === 'DESTETE_PRECEBO' ? 'PREINICIACION' : 'ENGORDE'}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  >
                    <option value="PREINICIACION">Preiniciación (Lechones)</option>
                    <option value="INICIACION">Iniciación</option>
                    <option value="LEVANTE">Levante</option>
                    <option value="ENGORDE">Engorde / Ceba</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bajas (Muertes)</label>
                  <input type="number" name="mortalityCount" placeholder="0" min="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Kilos Servidos</label>
                  <input type="number" step="0.5" name="manualKg" placeholder="Ej: 20" required className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Bultos de 40 Kg (Opcional)</label>
                  <input type="number" step="0.5" name="bultos" placeholder="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Costo Alimento ($)</label>
                <input type="number" name="feedCost" placeholder="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-semibold" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setActiveLogBatch(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer">
                  <Check className="w-3.5 h-3.5" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VENTA */}
      {/* ============================================================== */}
      {activeSaleBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">Venta: {activeSaleBatch.batchCode}</h3>
              <button onClick={() => setActiveSaleBatch(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                formData.append('batchId', activeSaleBatch.id);
                startTransition(async () => {
                  await addSwineSale(formData);
                  setActiveSaleBatch(null);
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cantidad Cerdos</label>
                  <input
                    type="number"
                    name="pigsSold"
                    value={pigsSold}
                    onChange={(e) => setPigsSold(e.target.value)}
                    min="1"
                    max={activeSaleBatch.currentQuantity}
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tipo de Venta</label>
                  <select
                    name="saleType"
                    defaultValue={activeSaleBatch.stage === 'DESTETE_PRECEBO' ? 'LECHON_DESTETADO' : 'EN_PIE'}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  >
                    <option value="EN_PIE">En Pie (Báscula)</option>
                    <option value="CANAL">En Canal (Faenado)</option>
                    <option value="LECHON_DESTETADO">Lechón Destetado</option>
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
                <span className="text-xs text-slate-500">Total Venta:</span>
                <span className="text-sm font-black text-emerald-800">${Math.round(computedTotalSale).toLocaleString('es-CO')}</span>
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
                  <input type="text" name="customer" placeholder="Ej: Carnicería / Particular" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setActiveSaleBatch(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">Cancelar</button>
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