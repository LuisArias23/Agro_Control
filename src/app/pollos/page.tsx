export const instant = false;

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Egg, ArrowLeft, PlusCircle, AlertCircle, Calendar } from 'lucide-react';
import { createPoultryBatch } from './actions';
import { DailyLogForm } from './DailyLogForm';
import { BatchHistoryModal } from './BatchHistoryModal';
import { EditBatchModal } from './EditBatchModal';
import { PoultrySalesModal } from './PoultrySalesModal';

export default async function PollosPage() {
  const batches = await prisma.poultryBatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      dailyLogs: {
        orderBy: { date: 'desc' },
      },
      sales: {
        orderBy: { date: 'desc' },
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
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
                <Egg className="w-5 h-5 text-amber-600" />
                Avicultura (Pollos de Engorde)
              </h1>
              <p className="text-xs text-slate-500">Control de lotes, sacas parciales, inversión y liquidación</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Registro Nuevo Lote */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
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
                  placeholder="Ej: LOTE-1, LOTE-2"
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

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm mt-2 cursor-pointer"
              >
                Guardar Lote
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Lotes de Engorde */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Lotes Registrados</h2>

          {batches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Aún no has registrado ningún lote.</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario para cargar los lotes del galpón.</p>
            </div>
          ) : (
            batches.map((batch) => {
              // Cálculo de bajas reales (excluyendo las aves que ya se vendieron/sacaron)
              const totalMortality = batch.dailyLogs.reduce((acc, log) => acc + log.mortalityCount, 0);
              const totalSold = batch.sales.reduce((acc, s) => acc + s.birdsSold, 0);
              const mortalityRate = ((totalMortality / batch.initialQuantity) * 100).toFixed(1);

              const start = new Date(batch.startDate).getTime();
              const end = batch.endDate ? new Date(batch.endDate).getTime() : new Date().getTime();
              const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));

              const totalFeedServed = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedCost || 0), 0);
              const totalCost = Number(batch.chickCostTotal) + totalFeedCost;

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {batch.status === 'EN_ENGORDE' ? `Día ${diffDays}` : `Ciclo cerrado en ${diffDays} días`}
                        </span>
                        {/* Botón de Edición del Lote */}
                        <EditBatchModal
                          batch={{
                            id: batch.id,
                            batchCode: batch.batchCode,
                            startDate: batch.startDate.toISOString(),
                            initialQuantity: batch.initialQuantity,
                            chickCostTotal: Number(batch.chickCostTotal),
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ingresó: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        batch.status === 'EN_ENGORDE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {batch.status === 'EN_ENGORDE' ? 'EN ENGORDE' : 'LIQUIDADO'}
                    </span>
                  </div>

                  {/* Métricas clave del lote */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Población Viva</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                      {totalSold > 0 && (
                        <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                          ({totalSold} sacados)
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Mortalidad</span>
                      <p className="text-base font-bold text-rose-600">
                        {totalMortality} <span className="text-xs font-normal">({mortalityRate}%)</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento Total</span>
                      <p className="text-base font-bold text-slate-900">
                        {totalFeedServed.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Gasto Alimento</span>
                      <p className="text-base font-bold text-amber-700">${totalFeedCost.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Costo Acumulado</span>
                      <p className="text-base font-bold text-slate-900">${totalCost.toLocaleString('es-CO')}</p>
                    </div>
                  </div>

                  {/* Formulario de Novedad Diaria (solo si sigue activo) */}
                  {batch.status === 'EN_ENGORDE' && (
                    <DailyLogForm batchId={batch.id} />
                  )}

                  {/* Módulo de Sacas Parciales y Liquidación */}
                  <PoultrySalesModal
                    batchId={batch.id}
                    batchCode={batch.batchCode}
                    currentQuantity={batch.currentQuantity}
                    status={batch.status}
                    totalCost={totalCost}
                    sales={batch.sales.map((s) => ({
                      id: s.id,
                      date: s.date.toISOString(),
                      birdsSold: s.birdsSold,
                      saleType: s.saleType,
                      totalWeight: Number(s.totalWeight),
                      totalPrice: Number(s.totalPrice),
                      customer: s.customer,
                      notes: s.notes,
                    }))}
                  />

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