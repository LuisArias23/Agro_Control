export const instant = false;

import Link from 'next/link';
import { Waves, ArrowLeft, PlusCircle, Calendar, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createFishBatch } from './actions';
import { FishActionsForm } from './FishActionsForm';

export default async function PecesPage() {
  const ponds = await prisma.fishBatch.findMany({
    where: { status: 'ENGORDE' },
    orderBy: { createdAt: 'desc' },
    include: {
      dailyLogs: true,
      samplings: { orderBy: { date: 'desc' }, take: 1 },
      harvests: true,
    },
  });

  const SPECIES_NAMES: Record<string, string> = {
    TILAPIA_ROJA: 'Tilapia Roja',
    TILAPIA_NEGRA: 'Mojarra Negra',
    CACHAMA: 'Cachama',
    SABALO: 'Sábalo',
    BASA: 'Pez Basa',
    BOCACHICO: 'Bocachico',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Waves className="w-5 h-5 text-sky-600" />
                Piscicultura (Estanques en Geomembrana)
              </h1>
              <p className="text-xs text-slate-500">Biomasa estimada, muestreos de peso en gramos y raciones de alimento</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Siembra Estanque */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-sky-600" />
              Sembrar Estanque
            </h2>
            <form action={createFishBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador del Estanque</label>
                <input
                  type="text"
                  name="pondCode"
                  placeholder="Ej: ESTANQUE-1 (5m)"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Especie</label>
                <select
                  name="species"
                  className="w-full text-sm px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="TILAPIA_ROJA">Tilapia Roja</option>
                  <option value="TILAPIA_NEGRA">Mojarra Negra</option>
                  <option value="CACHAMA">Cachama</option>
                  <option value="SABALO">Sábalo</option>
                  <option value="BASA">Pez Basa</option>
                  <option value="BOCACHICO">Bocachico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Siembra</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Alevinos</label>
                  <input
                    type="number"
                    name="initialQuantity"
                    placeholder="Ej: 500"
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peso Siembra (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="initialAvgWeight"
                    defaultValue="5"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Total Semilla ($)</label>
                <input
                  type="number"
                  name="seedCostTotal"
                  placeholder="Inversión inicial"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm mt-2 cursor-pointer"
              >
                Registrar Siembra
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Estanques */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Estanques en Producción ({ponds.length})</h2>

          {ponds.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No hay estanques activos actualmente.</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario para registrar la siembra de un estanque.</p>
            </div>
          ) : (
            ponds.map((pond) => {
              const start = new Date(pond.startDate).getTime();
              const now = new Date().getTime();
              const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalMortality = pond.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const mortalityRate = ((totalMortality / pond.initialQuantity) * 100).toFixed(1);

              const totalFeedKg = pond.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = pond.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
              const totalInvestment = Number(pond.seedCostTotal) + totalFeedCost;

              const currentGrams = Number(pond.currentAvgWeight);
              const estimatedBiomassKg = ((pond.currentQuantity * currentGrams) / 1000).toFixed(1);

              return (
                <div key={pond.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{pond.pondCode}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {days}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {SPECIES_NAMES[pond.species] || pond.species}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sembrado el: {new Date(pond.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      ENGORDE ACTIVO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Población Estimada</span>
                      <p className="text-base font-bold text-slate-900">
                        {pond.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {pond.initialQuantity}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        {totalMortality} bajas ({mortalityRate}%)
                      </span>
                    </div>

                    <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-100">
                      <span className="text-xs text-sky-800">Peso Promedio</span>
                      <p className="text-base font-black text-sky-950">{currentGrams} <span className="text-xs font-normal">g</span></p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Última biometría</span>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                      <span className="text-xs text-emerald-800">Biomasa Estimada</span>
                      <p className="text-base font-black text-emerald-950">{estimatedBiomassKg} <span className="text-xs font-normal">Kg</span></p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">Pescado en tanque</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento Servido</span>
                      <p className="text-base font-bold text-slate-900">{totalFeedKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></p>
                      <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                        ${totalFeedCost.toLocaleString('es-CO')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Inversión Total</span>
                      <p className="text-base font-bold text-slate-900">${totalInvestment.toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Semilla + Alimento</span>
                    </div>
                  </div>

                  <FishActionsForm batchId={pond.id} />
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}