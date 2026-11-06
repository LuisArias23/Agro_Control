export const instant = false;

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Archive, Calendar, RotateCcw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { reopenPoultryBatch } from '../actions';

export default async function PollosHistorialPage() {
  const closedBatches = await prisma.poultryBatch.findMany({
    where: { status: 'LIQUIDADO' },
    orderBy: { endDate: 'desc' },
    include: {
      dailyLogs: true,
      sales: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/avicultura"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Archive className="w-5 h-5 text-slate-700" />
                Historial de Lotes Liquidados
              </h1>
              <p className="text-xs text-slate-500">Resumen histórico de ciclos cerrados y utilidades netas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {closedBatches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
            <Archive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No hay lotes liquidados todavía</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cuando termines las sacas de un lote y lo liquides en el módulo de ventas, aparecerá aquí guardado con su balance.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {closedBatches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const end = batch.endDate ? new Date(batch.endDate).getTime() : new Date().getTime();
              const durationDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

              const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const mortalityRate = ((totalMortality / batch.initialQuantity) * 100).toFixed(1);

              const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
              const totalCost = Number(batch.chickCostTotal) + totalFeedCost;

              const totalBirdsSold = batch.sales.reduce((acc, s) => acc + s.birdsSold, 0);
              const totalIncome = batch.sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
              const netProfit = totalIncome - totalCost;

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Duración: {durationDays} días
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Desde: {new Date(batch.startDate).toLocaleDateString()} — Liquidado:{' '}
                        {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full">
                        LIQUIDADO
                      </span>
                      <form action={async () => {
                        'use server';
                        await reopenPoultryBatch(batch.id);
                      }}>
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition flex items-center gap-1 border border-slate-200"
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
                      <span className="text-[11px] text-slate-500 block">Pollos Iniciales</span>
                      <p className="text-sm font-bold text-slate-900">{batch.initialQuantity} aves</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Aves Sacadas</span>
                      <p className="text-sm font-bold text-slate-900">{totalBirdsSold} aves</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Mortalidad</span>
                      <p className="text-sm font-bold text-rose-600">{totalMortality} ({mortalityRate}%)</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Inversión Total</span>
                      <p className="text-sm font-bold text-slate-800">${totalCost.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Ventas Totales</span>
                      <p className="text-sm font-bold text-slate-900">${totalIncome.toLocaleString('es-CO')}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <span className="text-[11px] text-slate-600 block flex items-center gap-1 font-semibold">
                        {netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                        Utilidad Neta
                      </span>
                      <p className={`text-sm font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        ${netProfit.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}