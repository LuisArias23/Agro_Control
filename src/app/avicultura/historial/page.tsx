export const instant = false;

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  ArrowLeft,
  Archive,
  Calendar,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Check,
  AlertCircle,
  Snowflake,
} from 'lucide-react';
import { reopenPoultryBatch } from '../actions';

export default async function PollosHistorialPage() {
  const closedBatches = await prisma.poultryBatch.findMany({
    where: { status: 'LIQUIDADO' },
    orderBy: { endDate: 'desc' },
    include: {
      dailyLogs: { orderBy: { date: 'desc' } },
      sales: { orderBy: { date: 'desc' } },
    },
  });

  // Totales acumulados de todos los lotes liquidados
  const historicalSummary = closedBatches.reduce(
    (acc, batch) => {
      const feedCost = batch.dailyLogs.reduce((sum, l) => sum + Number(l.feedCost || 0), 0);
      const batchCost = Number(batch.chickCostTotal) + feedCost;
      const batchBirds = batch.sales.reduce((sum, s) => sum + s.birdsSold, 0);
      const batchSales = batch.sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);

      acc.totalBirds += batchBirds;
      acc.totalInvestment += batchCost;
      acc.totalSales += batchSales;
      acc.totalProfit += batchSales - batchCost;
      return acc;
    },
    { totalBirds: 0, totalInvestment: 0, totalSales: 0, totalProfit: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/avicultura"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold flex items-center gap-1.5 truncate">
                <Archive className="w-5 h-5 text-slate-700 shrink-0" />
                <span className="truncate">Historial Liquidado</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Ciclos cerrados, costos reales, ventas y utilidades netas
              </p>
            </div>
          </div>

          <Link
            href="/avicultura/ventas"
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition whitespace-nowrap shrink-0 ml-auto sm:ml-0"
          >
            ← Ventas Activas
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 space-y-6">
        {closedBatches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            <Archive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No hay lotes liquidados todavía</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cuando termines las sacas de un lote y lo liquides en el módulo de ventas, aparecerá aquí guardado con su balance.
            </p>
          </div>
        ) : (
          <>
            {/* Resumen Histórico Consolidado */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Aves Vendidas</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {historicalSummary.totalBirds} <span className="text-xs font-normal text-slate-400">pollos</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Inversión Histórica</span>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  ${historicalSummary.totalInvestment.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Ventas Totales</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ${historicalSummary.totalSales.toLocaleString('es-CO')}
                </p>
              </div>
              <div
                className={`p-4 rounded-xl border shadow-sm ${
                  historicalSummary.totalProfit >= 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <span className="text-xs font-semibold text-slate-700 uppercase">Utilidad Acumulada</span>
                <p
                  className={`text-2xl font-black mt-1 ${
                    historicalSummary.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  ${historicalSummary.totalProfit.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {/* Listado de Lotes Liquidados */}
            <div className="space-y-4">
              {closedBatches.map((batch) => {
                const start = new Date(batch.startDate).getTime();
                const end = batch.endDate ? new Date(batch.endDate).getTime() : new Date().getTime();
                const durationDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

                const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
                const mortalityRate = ((totalMortality / batch.initialQuantity) * 100).toFixed(1);

                const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
                const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
                const chickCost = Number(batch.chickCostTotal);
                const totalCost = chickCost + totalFeedCost;

                const totalBirdsSold = batch.sales.reduce((acc, s) => acc + s.birdsSold, 0);
                const freezerRemaining = batch.freezerQuantity || 0;
                const liveRemaining = batch.currentQuantity || 0;

                const usefulBirds = totalBirdsSold + freezerRemaining + liveRemaining;
                const realUnitCost = usefulBirds > 0 ? Math.round(totalCost / usefulBirds) : 0;

                const totalIncome = batch.sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
                const netProfit = totalIncome - totalCost;

                return (
                  <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Duración: {durationDays} días · {totalFeedKg.toFixed(1)} Kg alimento
                          </span>
                          {freezerRemaining > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full flex items-center gap-1">
                              <Snowflake className="w-3 h-3" /> {freezerRemaining} en congelador
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Desde: {new Date(batch.startDate).toLocaleDateString('es-CO')} — Liquidado:{' '}
                          {batch.endDate ? new Date(batch.endDate).toLocaleDateString('es-CO') : 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full">
                          LIQUIDADO
                        </span>
                        <form
                          action={async () => {
                            'use server';
                            await reopenPoultryBatch(batch.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition flex items-center gap-1 border border-slate-200 cursor-pointer"
                            title="Volver a poner como lote activo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Resumen Final del Lote */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Población / Bajas</span>
                        <p className="text-sm font-bold text-slate-900">
                          {totalBirdsSold} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                        </p>
                        <span className="text-[10px] text-rose-600 block mt-0.5">
                          {totalMortality} bajas ({mortalityRate}%)
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Alimento Total</span>
                        <p className="text-sm font-bold text-slate-900">{totalFeedKg.toFixed(1)} Kg</p>
                        <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                          ${totalFeedCost.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Inversión Total</span>
                        <p className="text-sm font-bold text-slate-800">${totalCost.toLocaleString('es-CO')}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Pollitos: ${chickCost.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Costo Real / Ave</span>
                        <p className="text-sm font-bold text-slate-900">${realUnitCost.toLocaleString('es-CO')}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Sobre {usefulBirds} aves útiles
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Ventas Totales</span>
                        <p className="text-sm font-bold text-slate-900">${totalIncome.toLocaleString('es-CO')}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {batch.sales.length} despachos
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-lg border ${
                          netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                        }`}
                      >
                        <span className="text-[11px] text-slate-600 block flex items-center gap-1 font-semibold">
                          {netProfit >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          Utilidad Neta
                        </span>
                        <p
                          className={`text-sm font-black ${
                            netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          ${netProfit.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Detalle de Ventas y Registros de este Lote Liquidado */}
                    <div className="flex flex-col gap-2 pt-1">
                      {batch.sales.length > 0 && (
                        <details>
                          <summary className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                            Ver detalle de las {batch.sales.length} ventas / despachos de este lote
                          </summary>
                          <div className="mt-2.5 overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3">Fecha</th>
                                  <th className="py-2 px-3">Cantidad</th>
                                  <th className="py-2 px-3">Modalidad</th>
                                  <th className="py-2 px-3">Kilos</th>
                                  <th className="py-2 px-3">Total ($)</th>
                                  <th className="py-2 px-3">Estado</th>
                                  <th className="py-2 px-3">Cliente</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {batch.sales.map(sale => (
                                  <tr key={sale.id} className="hover:bg-slate-50">
                                    <td className="py-1.5 px-3 text-slate-600">
                                      {new Date(sale.date).toLocaleDateString('es-CO', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </td>
                                    <td className="py-1.5 px-3 font-bold text-slate-800">{sale.birdsSold} aves</td>
                                    <td className="py-1.5 px-3 text-slate-600">
                                      {sale.saleType === 'EN_PIE' ? 'En Pie' : 'Canal'}
                                    </td>
                                    <td className="py-1.5 px-3">
                                      {Number(sale.totalWeight) > 0 ? `${Number(sale.totalWeight)} Kg` : '-'}
                                    </td>
                                    <td className="py-1.5 px-3 font-bold text-emerald-700">
                                      ${Number(sale.totalPrice).toLocaleString('es-CO')}
                                    </td>
                                    <td className="py-1.5 px-3">
                                      {sale.paymentStatus === 'PAGADO' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <Check className="w-3 h-3" /> Pagado
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                          <AlertCircle className="w-3 h-3" /> Fiado
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-3 text-slate-700">{sale.customer || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}

                      {batch.dailyLogs.length > 0 && (
                        <details>
                          <summary className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                            Ver historial de consumos y bajas ({batch.dailyLogs.length} registros)
                          </summary>
                          <div className="mt-2.5 overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3">Fecha</th>
                                  <th className="py-2 px-3">Alimento</th>
                                  <th className="py-2 px-3">Costo ($)</th>
                                  <th className="py-2 px-3">Bajas</th>
                                  <th className="py-2 px-3">Detalle / Notas</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {batch.dailyLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="py-1.5 px-3 text-slate-600 whitespace-nowrap">
                                      {new Date(log.date).toLocaleDateString('es-CO', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </td>
                                    <td className="py-1.5 px-3 font-semibold text-slate-800">
                                      {Number(log.feedKgServed) > 0 ? `${Number(log.feedKgServed)} Kg` : '-'}
                                    </td>
                                    <td className="py-1.5 px-3 text-amber-800 font-semibold">
                                      {Number(log.feedCost) > 0 ? `$${Number(log.feedCost).toLocaleString('es-CO')}` : '-'}
                                    </td>
                                    <td className="py-1.5 px-3 text-rose-600 font-bold">
                                      {log.mortalityCount > 0 ? `${log.mortalityCount}` : '-'}
                                    </td>
                                    <td className="py-1.5 px-3 text-slate-600">{log.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}