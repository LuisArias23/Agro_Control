export const instant = false;

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Bird,
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Archive,
  UtensilsCrossed,
  Droplet,
  Scale,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { createPoultryBatch } from './actions';
import { DailyLogForm } from './DailyLogForm';
import { BatchHistoryModal } from './BatchHistoryModal';
import { EditBatchModal } from './EditBatchModal';
import { PoultryAdvancedModals } from './PoultryAdvancedModals';

export default async function PollosPage() {
  const [activeBatches, closedBatchesCount] = await Promise.all([
    prisma.poultryBatch.findMany({
      where: { status: 'EN_ENGORDE' },
      orderBy: { createdAt: 'desc' },
      include: {
        dailyLogs: { orderBy: { date: 'desc' } },
        sales: true,
        samplings: { orderBy: { date: 'desc' }, take: 1 },
        treatments: { orderBy: { date: 'desc' } },
      },
    }),
    prisma.poultryBatch.count({ where: { status: 'LIQUIDADO' } }),
  ]);

  const totalFeedersInUse = activeBatches.reduce((acc, b) => acc + (b.feedersCount || 0), 0);
  const totalDrinkersInUse = activeBatches.reduce((acc, b) => acc + (b.drinkersCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
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
                <Bird className="w-5 h-5 text-amber-600" />
                Avicultura (Pollos de Engorde)
              </h1>
              <p className="text-xs text-slate-500">Manejo de galpón, lotes, conversión (FCA) y costos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/avicultura/historial"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              Historial ({closedBatchesCount})
            </Link>

            <Link
              href="/avicultura/ventas"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition"
            >
              <DollarSign className="w-4 h-4" />
              Ventas y Fiados
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Registro Nuevo Lote */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              Ingresar Lote de Engorde
            </h2>
            <form action={createPoultryBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador del Lote</label>
                <input
                  type="text"
                  name="batchCode"
                  placeholder="Ej: LOTE-3"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Entrada al Galpón</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Pollitos</label>
                  <input
                    type="number"
                    name="initialQuantity"
                    placeholder="100"
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="chickCostTotal"
                    placeholder="Inversión inicial"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-2">
                <span className="block text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                  Equipos asignados al lote
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Comederos (Und)</label>
                    <input
                      type="number"
                      name="feedersCount"
                      placeholder="0"
                      min="0"
                      defaultValue="0"
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Bebederos (Und)</label>
                    <input
                      type="number"
                      name="drinkersCount"
                      placeholder="0"
                      min="0"
                      defaultValue="0"
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-sky-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-xs mt-2 cursor-pointer"
              >
                Guardar Lote
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Lotes Activos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Lotes Activos en Galpón ({activeBatches.length})</h2>
            
            <div className="flex items-center gap-2 text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <span className="flex items-center gap-1 text-amber-800">
                <UtensilsCrossed className="w-3.5 h-3.5" /> {totalFeedersInUse} comederos en uso
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-sky-800">
                <Droplet className="w-3.5 h-3.5" /> {totalDrinkersInUse} bebederos en uso
              </span>
            </div>
          </div>

          {activeBatches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No hay lotes en engorde actualmente.</p>
            </div>
          ) : (
            activeBatches.map((batch) => {
              const totalMortality = batch.dailyLogs.reduce((acc, log) => acc + log.mortalityCount, 0);
              const totalSold = batch.sales.reduce((acc, s) => acc + s.birdsSold, 0);
              const mortalityRate = ((totalMortality / batch.initialQuantity) * 100).toFixed(1);

              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              // Ciclo proyectado a 45 días
              const targetDays = 45;
              const cycleProgress = Math.min(100, Math.round((diffDays / targetDays) * 100));
              const daysRemaining = Math.max(0, targetDays - diffDays);

              const totalFeedServed = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedCost || 0), 0);
              const totalCost = Number(batch.chickCostTotal) + totalFeedCost;

              // Costo real unitario por pollo vivo actual
              const unitCost = batch.currentQuantity > 0 ? (totalCost / batch.currentQuantity) : 0;

              // Muestreo más reciente y Conversión (FCA)
              const latestSampling = batch.samplings[0];
              const avgWeightGrams = latestSampling ? Number(latestSampling.avgWeightGrams) : null;
              const avgWeightLbs = avgWeightGrams ? (avgWeightGrams / 453.592).toFixed(2) : null;

              const totalLiveBiomassKg = avgWeightGrams ? (batch.currentQuantity * (avgWeightGrams / 1000)) : null;
              const fca = totalLiveBiomassKg && totalLiveBiomassKg > 0
                ? (totalFeedServed / totalLiveBiomassKg).toFixed(2)
                : null;

              // Retiro sanitario activo
              const activeWithdrawalTreatment = batch.treatments.find((t) => {
                if (t.withdrawalDays <= 0) return false;
                const treatmentDate = new Date(t.date).getTime();
                const daysSince = Math.floor((now - treatmentDate) / (1000 * 60 * 60 * 24));
                return daysSince < t.withdrawalDays;
              });

              const feeders = batch.feedersCount || 0;
              const drinkers = batch.drinkersCount || 0;
              const birdsPerFeeder = feeders > 0 ? (batch.currentQuantity / feeders).toFixed(1) : '-';
              const birdsPerDrinker = drinkers > 0 ? (batch.currentQuantity / drinkers).toFixed(1) : '-';

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {diffDays} de {targetDays}
                        </span>
                        <EditBatchModal
                          batch={{
                            id: batch.id,
                            batchCode: batch.batchCode,
                            startDate: batch.startDate.toISOString(),
                            initialQuantity: batch.initialQuantity,
                            chickCostTotal: Number(batch.chickCostTotal),
                            feedersCount: feeders,
                            drinkersCount: drinkers,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ingresó: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <PoultryAdvancedModals batchId={batch.id} batchCode={batch.batchCode} />
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        EN ENGORDE
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso del ciclo */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Progreso de Engorde: {cycleProgress}%</span>
                      <span>
                        {daysRemaining === 0 ? '¡Listo para saca!' : `Faltan ${daysRemaining} días para beneficio`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          cycleProgress >= 100 ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${cycleProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Alerta de Retiro Sanitario si aplica */}
                  {activeWithdrawalTreatment && (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Retiro Sanitario Activo ({activeWithdrawalTreatment.productName}): No comercializar hasta cumplir los {activeWithdrawalTreatment.withdrawalDays} días.
                      </span>
                    </div>
                  )}

                  {/* Métricas Principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Población Viva</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">
                        {totalMortality} bajas ({mortalityRate}%)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Peso Promedio</span>
                      <p className="text-base font-bold text-indigo-950">
                        {avgWeightGrams ? `${avgWeightGrams} g` : <span className="text-xs text-slate-400 font-normal">Sin pesaje</span>}
                      </p>
                      {avgWeightLbs && (
                        <span className="text-[10px] text-indigo-700 block mt-0.5">~{avgWeightLbs} Libras/ave</span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">FCA (Conversión)</span>
                      <p className="text-base font-bold text-slate-900">
                        {fca ? `${fca} : 1` : <span className="text-xs text-slate-400 font-normal">Requiere peso</span>}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Kg comida/Kg ave</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento Total</span>
                      <p className="text-base font-bold text-slate-900">
                        {totalFeedServed.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span>
                      </p>
                      <span className="text-[10px] text-amber-700 block mt-0.5">${totalFeedCost.toLocaleString('es-CO')}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Costo Acumulado</span>
                      <p className="text-base font-bold text-slate-900">${totalCost.toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Pollitos + Comida</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-900 font-semibold">Costo Real / Ave</span>
                      <p className="text-base font-black text-emerald-950">${Math.round(unitCost).toLocaleString('es-CO')}</p>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">Base para precio venta</span>
                    </div>
                  </div>

                  {/* Fila de equipos asignados en este lote */}
                  <div className="flex flex-wrap items-center gap-3 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs">
                    <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Equipos en Galpón:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                      <span>{feeders} Comederos</span>
                      <span className="text-[10px] font-normal text-slate-500">({birdsPerFeeder} aves/com)</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5 font-semibold text-sky-950">
                      <Droplet className="w-3.5 h-3.5 text-sky-600" />
                      <span>{drinkers} Bebederos</span>
                      <span className="text-[10px] font-normal text-slate-500">({birdsPerDrinker} aves/beb)</span>
                    </div>
                  </div>

                  {/* Formulario de Novedad Diaria */}
                  <DailyLogForm batchId={batch.id} />

                  {/* Historial de Consumos y Bajas */}
                  <BatchHistoryModal
                    logs={batch.dailyLogs.map((log) => ({
                      id: log.id,
                      date: log.date.toISOString(),
                      mortalityCount: log.mortalityCount,
                      feedKgServed: Number(log.feedKgServed),
                      feedCost: Number(log.feedCost || 0),
                      feedBrand: log.feedBrand,
                      notes: log.notes,
                    }))}
                    batchCode={batch.batchCode}
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