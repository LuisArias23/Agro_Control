export const instant = false;

import Link from 'next/link';
import { Egg, ArrowLeft, PlusCircle, AlertCircle, Calendar, ChevronDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createLayerBatch } from './actions';
import { LayerActionsForm } from './LayerActionsForm';
import { LayerHistoryTable } from './LayerHistoryTable';
import { EditLayerBatchModal } from './EditLayerBatchModal';
import { EggSalesModal } from './EggSalesModal';

// Cálculo de consumo acumulado teórico por ave (en Kg) según días de edad
function getExpectedFeedPerHenKg(days: number): number {
  let grams = 0;
  for (let d = 1; d <= days; d++) {
    if (d <= 42) grams += 30;        // Sem. 1-6 (Cría): ~30 g/día
    else if (d <= 84) grams += 55;   // Sem. 7-12 (Levante): ~55 g/día
    else if (d <= 125) grams += 75;  // Sem. 13-17 (Pre-postura): ~75 g/día
    else grams += 112;               // Sem. 18+ (Postura adulta): ~112 g/día
  }
  return grams / 1000;
}

export default async function PonedorasPage() {
  const batches = await prisma.layerBatch.findMany({
    where: { status: 'EN_POSTURA' },
    orderBy: { startDate: 'asc' },
    include: {
      eggLogs: { orderBy: { date: 'desc' } },
      sales: { orderBy: { date: 'desc' } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-1.5 truncate">
                <Egg className="w-5 h-5 text-amber-700 shrink-0" />
                <span className="truncate">Gallinas Ponedoras</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Recolección de huevos, postura diaria, ventas e inventario
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Formulario Colapsable Ingreso Lote */}
        <div className="lg:col-span-1">
          <details className="group bg-white rounded-xl border border-slate-200 shadow-xs lg:sticky lg:top-24 overflow-hidden">
            <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between hover:bg-amber-50/40 transition select-none">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Ingresar Lote de Postura
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Toca para desplegar formulario de ingreso
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180 shrink-0" />
            </summary>

            <form action={createLayerBatch} className="p-5 pt-2 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador del Lote</label>
                <input
                  type="text"
                  name="batchCode"
                  placeholder="Ej: LOTE-PONEDORAS-2"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Entrada (Día 1)</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Gallinas</label>
                  <input
                    type="number"
                    name="initialHens"
                    placeholder="Ej: 100"
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Inversión Inicial ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costTotal"
                    placeholder="Inversión inicial"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-xs mt-2 cursor-pointer"
              >
                Registrar Lote
              </button>
            </form>
          </details>
        </div>

        {/* Listado de Lotes */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Lotes en Postura ({batches.length})</h2>

          {batches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No hay lotes de postura activos.</p>
              <p className="text-xs text-slate-400 mt-1">
                Registra un nuevo lote de gallinas para empezar a monitorear la producción.
              </p>
            </div>
          ) : (
            batches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
              const currentWeek = Math.floor(days / 7);

              const startLayingDay = 126;
              const endLayingDay = 560;
              const layingSpanDays = endLayingDay - startLayingDay;

              const isLaying = days >= startLayingDay;
              const daysUntilLaying = Math.max(0, startLayingDay - days);
              const weeksUntilLaying = (daysUntilLaying / 7).toFixed(1);

              const daysInLaying = Math.max(0, days - startLayingDay);
              const daysRemainingLaying = Math.max(0, endLayingDay - days);
              const monthsRemainingLaying = (daysRemainingLaying / 30).toFixed(1);

              const progressPercent = !isLaying
                ? Math.min(100, Math.round((days / startLayingDay) * 100))
                : Math.min(100, Math.round((daysInLaying / layingSpanDays) * 100));

              const totalMortality = batch.eggLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const totalEggsGood = batch.eggLogs.reduce((acc, l) => acc + l.eggsCollected, 0);
              const totalEggsBroken = batch.eggLogs.reduce((acc, l) => acc + l.eggsBroken, 0);
              const totalFeedKg = batch.eggLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = batch.eggLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);

              const initialInvestment = Number(batch.costTotal);
              const totalInvestment = initialInvestment + totalFeedCost;

              const expectedFeedKg = getExpectedFeedPerHenKg(days) * batch.currentHens;
              const expectedBultos = (expectedFeedKg / 40).toFixed(1);
              const realBultos = (totalFeedKg / 40).toFixed(1);

              const totalSoldUnits = batch.sales.reduce((acc, s) => acc + s.unitsSold, 0);
              const totalIncome = batch.sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
              const pendingFiado = batch.sales
                .filter((s) => !s.isPaid)
                .reduce((acc, s) => acc + Number(s.totalAmount), 0);
              const balance = totalIncome - totalInvestment;

              const availableEggs = Math.max(0, totalEggsGood - totalSoldUnits);
              const availablePanales = (availableEggs / 30).toFixed(1);

              const lastLog = batch.eggLogs[0];
              const todayEggs = lastLog ? lastLog.eggsCollected + lastLog.eggsBroken : 0;
              const posturePercent =
                batch.currentHens > 0 ? ((todayEggs / batch.currentHens) * 100).toFixed(1) : '0';

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {days} (Sem. {currentWeek})
                        </span>
                        <EditLayerBatchModal
                          batch={{
                            id: batch.id,
                            batchCode: batch.batchCode,
                            startDate: batch.startDate.toISOString(),
                            initialHens: batch.initialHens,
                            costTotal: initialInvestment,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Inició: {new Date(batch.startDate).toLocaleDateString('es-CO')} · Inv. aves: $
                        {initialInvestment.toLocaleString('es-CO')} · Inv. total: $
                        {totalInvestment.toLocaleString('es-CO')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <EggSalesModal
                        batchId={batch.id}
                        batchCode={batch.batchCode}
                        availableEggs={availableEggs}
                        sales={batch.sales.map((s) => ({
                          id: s.id,
                          date: s.date.toISOString(),
                          panalesSold: Number(s.panalesSold),
                          unitsSold: s.unitsSold,
                          totalAmount: Number(s.totalAmount),
                          customerName: s.customerName,
                          isPaid: s.isPaid,
                        }))}
                      />
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          isLaying
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isLaying ? 'EN POSTURA' : 'EN LEVANTE'}
                      </span>
                    </div>
                  </div>

                  {/* Progreso hacia inicio de postura y duración de ciclo productivo */}
                  <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-lg space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-semibold">
                      {!isLaying ? (
                        <>
                          <span className="text-amber-950">
                            Faltan <strong>{daysUntilLaying} días</strong> (~{weeksUntilLaying} sem.) para empezar a poner (Sem. 18)
                          </span>
                          <span className="text-slate-600">
                            Duración estimada poniendo: <strong>~14 meses</strong> (Sem. 18 a 80)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-900">
                            En postura activa: <strong>{daysInLaying} días</strong> poniendo (Sem. {currentWeek} de 80)
                          </span>
                          <span className="text-slate-600">
                            Vida útil restante: <strong>~{monthsRemainingLaying} meses</strong> ({daysRemainingLaying} días)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isLaying ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Métricas Principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Gallinas Vivas</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentHens}{' '}
                        <span className="text-xs font-normal text-slate-400">/ {batch.initialHens}</span>
                      </p>
                      <span className="text-[10px] text-rose-600 block mt-0.5">{totalMortality} bajas</span>
                    </div>

                    <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                      <span className="text-xs text-amber-900 font-semibold">% Postura Hoy</span>
                      <p className="text-base font-black text-amber-950">{posturePercent}%</p>
                      <span className="text-[10px] text-amber-800 block mt-0.5">{todayEggs} huevos hoy</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                      <span className="text-xs text-emerald-900 font-semibold">Stock Huevos Libre</span>
                      <p className="text-base font-black text-emerald-950">
                        {availableEggs} <span className="text-xs font-normal text-emerald-700">und</span>
                      </p>
                      <span className="text-[10px] text-emerald-800 block mt-0.5 font-bold">
                        ~{availablePanales} panales
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento (Real / Est.)</span>
                      <p className="text-base font-bold text-slate-900">
                        {totalFeedKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span>
                      </p>
                      <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                        ${totalFeedCost.toLocaleString('es-CO')} ({realBultos} bto)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Est. ({days}d): ~{expectedFeedKg.toFixed(0)} Kg ({expectedBultos} bto)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Costo Acumulado</span>
                      <p className="text-base font-bold text-slate-900">
                        ${totalInvestment.toLocaleString('es-CO')}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Aves + Alimento
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Ventas / Balance</span>
                      <p className="text-base font-bold text-emerald-700">${totalIncome.toLocaleString('es-CO')}</p>
                      <span
                        className={`text-[10px] font-bold block mt-0.5 ${
                          balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        Bal: ${balance.toLocaleString('es-CO')}
                      </span>
                      {pendingFiado > 0 && (
                        <span className="text-[10px] text-amber-700 font-bold block">
                          Fiados: ${pendingFiado.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formulario de Registro Diario de Postura */}
                  <LayerActionsForm batchId={batch.id} />

                  {/* Historial de Registros */}
                  <LayerHistoryTable
                    logs={batch.eggLogs.map((l) => ({
                      id: l.id,
                      date: l.date.toISOString(),
                      eggsCollected: l.eggsCollected,
                      eggsBroken: l.eggsBroken,
                      mortalityCount: l.mortalityCount,
                      feedKgServed: Number(l.feedKgServed),
                      notes: l.notes,
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