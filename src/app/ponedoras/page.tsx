export const instant = false;

import Link from 'next/link';
import { Egg, ArrowLeft, PlusCircle, AlertCircle, Calendar, Archive, Layers } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createLayerBatch } from './actions';
import { LayerActionsForm } from './LayerActionsForm';
import { LayerHistoryTable } from './LayerHistoryTable';
import { EditLayerBatchModal } from './EditLayerBatchModal';
import { EggSalesModal } from './EggSalesModal';

export default async function PonedorasPage() {
  const batches = await prisma.layerBatch.findMany({
    where: { status: 'EN_POSTURA' },
    orderBy: { createdAt: 'desc' },
    include: {
      eggLogs: { orderBy: { date: 'desc' } },
      sales: { orderBy: { date: 'desc' } },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
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
                <Egg className="w-5 h-5 text-amber-700" />
                Gallinas Ponedoras
              </h1>
              <p className="text-xs text-slate-500">Recolección de huevos, postura diaria, ventas e inventario</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Ingreso Lote */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-amber-700" />
              Ingresar Lote de Postura
            </h2>
            <form action={createLayerBatch} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Entrada</label>
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
          </div>
        </div>

        {/* Listado de Lotes */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Lotes en Postura ({batches.length})</h2>

          {batches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No hay lotes de postura activos.</p>
              <p className="text-xs text-slate-400 mt-1">Registra un nuevo lote de gallinas para empezar a monitorear la producción.</p>
            </div>
          ) : (
            batches.map((batch) => {
              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const days = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalMortality = batch.eggLogs.reduce((acc, l) => acc + l.mortalityCount, 0);
              const totalEggsGood = batch.eggLogs.reduce((acc, l) => acc + l.eggsCollected, 0);
              const totalEggsBroken = batch.eggLogs.reduce((acc, l) => acc + l.eggsBroken, 0);
              const totalFeedKg = batch.eggLogs.reduce((acc, l) => acc + Number(l.feedKgServed), 0);

              // Ventas y saldo disponible
              const totalSoldUnits = batch.sales.reduce((acc, s) => acc + s.unitsSold, 0);
              const totalIncome = batch.sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
              const pendingFiado = batch.sales
                .filter((s) => !s.isPaid)
                .reduce((acc, s) => acc + Number(s.totalAmount), 0);

              const availableEggs = Math.max(0, totalEggsGood - totalSoldUnits);
              const availablePanales = (availableEggs / 30).toFixed(1);

              // Postura del día más reciente registrado
              const lastLog = batch.eggLogs[0];
              const todayEggs = lastLog ? (lastLog.eggsCollected + lastLog.eggsBroken) : 0;
              const posturePercent = batch.currentHens > 0 
                ? ((todayEggs / batch.currentHens) * 100).toFixed(1) 
                : '0';

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {days}
                        </span>
                        <EditLayerBatchModal
                          batch={{
                            id: batch.id,
                            batchCode: batch.batchCode,
                            startDate: batch.startDate.toISOString(),
                            initialHens: batch.initialHens,
                            costTotal: Number(batch.costTotal),
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Inició: {new Date(batch.startDate).toLocaleDateString()}
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
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        EN POSTURA
                      </span>
                    </div>
                  </div>

                  {/* Métricas Principales */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Gallinas Vivas</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentHens} <span className="text-xs font-normal text-slate-400">/ {batch.initialHens}</span>
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
                      <span className="text-[10px] text-emerald-800 block mt-0.5 font-bold">~{availablePanales} panales</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Huevos Históricos</span>
                      <p className="text-base font-bold text-slate-900">
                        {totalEggsGood} <span className="text-xs font-normal text-slate-500">aptos</span>
                      </p>
                      <span className="text-[10px] text-rose-500 block mt-0.5">{totalEggsBroken} rotos/sucios</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento Servido</span>
                      <p className="text-base font-bold text-slate-900">
                        {totalFeedKg.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span>
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Total acumulado</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Ventas Totales</span>
                      <p className="text-base font-bold text-emerald-700">${totalIncome.toLocaleString('es-CO')}</p>
                      {pendingFiado > 0 ? (
                        <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                          Fiados: ${pendingFiado.toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">Al día</span>
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