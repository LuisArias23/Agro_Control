export const instant = false;

import Link from 'next/link';
import { ArrowLeft, Archive, RefreshCw, Calendar, Fish } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { reopenFishBatch } from '../actions';

export default async function FishHistorialPage() {
  const closedBatches = await prisma.fishBatch.findMany({
    where: { status: 'LIQUIDADO' },
    orderBy: { endDate: 'desc' },
    include: {
      dailyLogs: true,
      samplings: { orderBy: { date: 'desc' }, take: 1 },
      harvests: true,
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/piscicultura"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Archive className="w-5 h-5 text-slate-600" />
                Historial de Estanques Liquidados
              </h1>
              <p className="text-xs text-slate-500">Ciclos de producción y cosechas finalizadas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {closedBatches.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
            <Archive className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No hay estanques en el historial.</p>
            <p className="text-xs text-slate-400 mt-1">Los lotes totalmente cosechados y liquidados aparecerán aquí.</p>
          </div>
        ) : (
          closedBatches.map((batch) => {
            const start = new Date(batch.startDate).getTime();
            const end = batch.endDate ? new Date(batch.endDate).getTime() : new Date().getTime();
            const totalDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

            const totalMortality = batch.dailyLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
            const totalFeedKg = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);
            const totalFeedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
            const totalInvested = Number(batch.seedCostTotal) + totalFeedCost;

            const totalHarvestKg = batch.harvests.reduce((acc, h) => acc + Number(h.totalKg), 0);
            const totalRevenue = batch.harvests.reduce((acc, h) => acc + Number(h.totalPrice), 0);
            const netProfit = totalRevenue - totalInvested;

            return (
              <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{batch.pondCode}</h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Ciclo cerrado ({totalDays} días)
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md">
                        {batch.species}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sembrado: {new Date(batch.startDate).toLocaleDateString()} — Liquidado:{' '}
                      {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : '-'}
                    </p>
                  </div>

                  <form
                    action={async () => {
                      'use server';
                      await reopenFishBatch(batch.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reactivar Estanque
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">Alevinos Iniciales</span>
                    <p className="text-base font-bold text-slate-900">{batch.initialQuantity}</p>
                    <span className="text-[10px] text-rose-600 block mt-0.5">{totalMortality} bajas totales</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">Alimento Total</span>
                    <p className="text-base font-bold text-slate-900">{totalFeedKg.toFixed(1)} Kg</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">${totalFeedCost.toLocaleString('es-CO')}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">Cosechado</span>
                    <p className="text-base font-bold text-sky-950">{totalHarvestKg.toFixed(1)} Kg</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Volumen final en pie</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500">Inversión Total</span>
                    <p className="text-base font-bold text-slate-900">${totalInvested.toLocaleString('es-CO')}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Semilla + Concentrado</span>
                  </div>

                  <div className={`p-3 rounded-lg border ${netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                    <span className="text-xs font-semibold text-slate-700">Utilidad Neta</span>
                    <p className={`text-base font-black ${netProfit >= 0 ? 'text-emerald-950' : 'text-rose-950'}`}>
                      ${netProfit.toLocaleString('es-CO')}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Ventas: ${totalRevenue.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}