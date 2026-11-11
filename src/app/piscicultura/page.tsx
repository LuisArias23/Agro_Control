export const instant = false;

import Link from 'next/link';
import { Waves, ArrowLeft, PlusCircle, AlertCircle, Calendar, Fish, DollarSign, Archive, CheckCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createFishBatch, closeFishBatch } from './actions';
import { FishModals } from './FishModals';
import { FishHistoryTable } from './FishHistoryTable';

const SPECIES_LABELS: Record<string, string> = {
  TILAPIA_ROJA: 'Tilapia Roja (Mojarra)',
  TILAPIA_NEGRA: 'Tilapia Negra / Nilótica',
  CACHAMA: 'Cachama',
  SABALO: 'Sábalo',
  BOCACHICO: 'Bocachico',
};

export default async function PisciculturaPage() {
  const [batches, closedBatchesCount] = await Promise.all([
    prisma.fishBatch.findMany({
      where: { status: 'ENGORDE' },
      orderBy: { createdAt: 'desc' },
      include: {
        dailyLogs: { orderBy: { date: 'desc' } },
        samplings: { orderBy: { date: 'desc' } },
        harvests: { orderBy: { date: 'desc' } },
      },
    }),
    prisma.fishBatch.count({
      where: { status: 'LIQUIDADO' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Cabecera con Accesos Rápidos */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
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
                <Fish className="w-5 h-5 text-sky-600" />
                Piscicultura (Estanques y Peces)
              </h1>
              <p className="text-xs text-slate-500">Biomasa en pie, muestreos de peso en gramos, alimentación y cosechas</p>
            </div>
          </div>

          {/* Accesos Rápidos: Historial y Ventas/Fiados */}
          <div className="flex items-center gap-2">
            <Link
              href="/piscicultura/historial"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              Historial ({closedBatchesCount})
            </Link>

            <Link
              href="/piscicultura/ventas"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition"
            >
              <DollarSign className="w-4 h-4" />
              Ventas y Fiados
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Ingreso Nuevo Estanque */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-sky-600" />
              Sembrar Estanque / Lote
            </h2>
            <form action={createFishBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador del Estanque</label>
                <input
                  type="text"
                  name="pondCode"
                  placeholder="Ej: ESTANQUE-1 (5m)"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Especie</label>
                <select
                  name="species"
                  defaultValue="TILAPIA_ROJA"
                  className="w-full text-sm px-3 py-2 border rounded-lg bg-white font-medium"
                >
                  <option value="TILAPIA_ROJA">Tilapia Roja (Mojarra)</option>
                  <option value="TILAPIA_NEGRA">Tilapia Negra / Nilótica</option>
                  <option value="CACHAMA">Cachama</option>
                  <option value="SABALO">Sábalo</option>
                  <option value="BOCACHICO">Bocachico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Alevinos</label>
                  <input
                    type="number"
                    name="initialQuantity"
                    placeholder="400"
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peso Inicial (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="initialAvgWeight"
                    defaultValue="1.0"
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Siembra</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Alevinos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="seedCostTotal"
                    placeholder="Inversión"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sky-700 hover:bg-sky-800 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-xs mt-2 cursor-pointer"
              >
                Guardar Siembra
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Estanques Activos */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Estanques en Producción ({batches.length})</h2>

          {batches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No hay estanques activos actualmente.</p>
              <p className="text-xs text-slate-400 mt-1">Registra una nueva siembra de alevinos para empezar el monitoreo.</p>
            </div>
          ) : (
            batches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
              const totalInvested = Number(batch.seedCostTotal) + totalFeedCost;

              const avgWeight = Number(batch.currentAvgWeight);
              const estimatedBiomassKg = (batch.currentQuantity * avgWeight) / 1000;
              const fca = estimatedBiomassKg > 0 ? (totalFeedKg / estimatedBiomassKg).toFixed(2) : '-';
              const suggestedDailyFeedKg = ((estimatedBiomassKg * 0.03)).toFixed(2);

              const totalHarvestKg = batch.harvests.reduce((acc, h) => acc + Number(h.totalKg), 0);
              const totalHarvestIncome = batch.harvests.reduce((acc, h) => acc + Number(h.totalPrice || 0), 0);

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.pondCode}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-sky-100 text-sky-900 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {diffDays}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {SPECIES_LABELS[batch.species] || batch.species}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sembrado: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          'use server';
                          await closeFishBatch(batch.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Cerrar y pasar a historial"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                          Liquidar Estanque
                        </button>
                      </form>

                      <span className="text-xs font-bold px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
                        ENGORDE ACTIVO
                      </span>
                    </div>
                  </div>

                  {/* Métricas Principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Población Viva</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">{totalMortality} bajas</span>
                    </div>

                    <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-200">
                      <span className="text-xs text-sky-950 font-semibold">Peso Promedio</span>
                      <p className="text-base font-black text-sky-950">{avgWeight} g</p>
                      <span className="text-[10px] text-sky-700 block mt-0.5">~{(avgWeight / 453.592).toFixed(2)} Libras</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-900 font-semibold">Biomasa en Pie</span>
                      <p className="text-base font-black text-emerald-950">{estimatedBiomassKg.toFixed(1)} Kg</p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">Ración diaria: ~{suggestedDailyFeedKg} Kg</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">FCA (Conversión)</span>
                      <p className="text-base font-bold text-slate-900">{fca} : 1</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{totalFeedKg.toFixed(1)} Kg servidos</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Costo Acumulado</span>
                      <p className="text-base font-bold text-slate-900">${totalInvested.toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Alevinos + Comida</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Cosechado</span>
                      <p className="text-base font-bold text-emerald-700">{totalHarvestKg.toFixed(1)} Kg</p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">${totalHarvestIncome.toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <FishModals
                    batchId={batch.id}
                    pondCode={batch.pondCode}
                    currentQuantity={batch.currentQuantity}
                    currentAvgWeight={avgWeight}
                  />

                  {/* Historial de Registros */}
                  <FishHistoryTable
                    logs={batch.dailyLogs.map((l) => ({
                      id: l.id,
                      date: l.date.toISOString(),
                      mortalityCount: l.mortalityCount,
                      feedKgServed: Number(l.feedKgServed),
                      proteinPercentage: l.proteinPercentage,
                      feedCost: Number(l.feedCost || 0),
                      notes: l.notes,
                    }))}
                    harvests={batch.harvests.map((h) => ({
                      id: h.id,
                      date: h.date.toISOString(),
                      fishCount: h.fishCount,
                      totalKg: Number(h.totalKg),
                      totalPrice: Number(h.totalPrice || 0),
                      paymentStatus: h.paymentStatus || 'PAGADO',
                      customer: h.customer || null,
                    }))}
                  />
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}