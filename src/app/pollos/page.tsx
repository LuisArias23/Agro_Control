export const instant = false;

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Egg, ArrowLeft, PlusCircle, Activity, AlertCircle, Calendar } from 'lucide-react';
import { createPoultryBatch } from './actions';
import { DailyLogForm } from './DailyLogForm';
import { BatchHistoryModal } from './BatchHistoryModal';

export default async function PollosPage() {
  const batches = await prisma.poultryBatch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      dailyLogs: {
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
              <p className="text-xs text-slate-500">Control de lotes, marcas de alimento, inversión y mortalidad</p>
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
                  placeholder="Ej: LOTE-1, LOTE-2, LOTE-3"
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
          <h2 className="text-lg font-bold text-slate-900">Lotes en Producción</h2>

          {batches.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Aún no has registrado ningún lote.</p>
              <p className="text-xs text-slate-400 mt-1">Usa el formulario para cargar los lotes del galpón.</p>
            </div>
          ) : (
            batches.map((batch) => {
              const mortalitySum = batch.initialQuantity - batch.currentQuantity;
              const mortalityRate = ((mortalitySum / batch.initialQuantity) * 100).toFixed(1);

              const start = new Date(batch.startDate).getTime();
              const now = new Date().getTime();
              const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));

              const totalFeedServed = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedKgServed), 0);
              const totalFeedCost = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedCost || 0), 0);
              const totalInvestment = Number(batch.chickCostTotal) + totalFeedCost;

              return (
                <div key={batch.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{batch.batchCode}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Día {diffDays}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ingresó: {new Date(batch.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                      {batch.status}
                    </span>
                  </div>

                  {/* Métricas clave del lote */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Población Viva</span>
                      <p className="text-base font-bold text-slate-900">
                        {batch.currentQuantity} <span className="text-xs font-normal text-slate-400">/ {batch.initialQuantity}</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Mortalidad</span>
                      <p className="text-base font-bold text-rose-600">
                        {mortalitySum} <span className="text-xs font-normal">({mortalityRate}%)</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Alimento Total</span>
                      <p className="text-base font-bold text-slate-900">{totalFeedServed.toFixed(1)} <span className="text-xs font-normal text-slate-500">Kg</span></p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Gasto Alimento</span>
                      <p className="text-base font-bold text-amber-700">${totalFeedCost.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-500">Inversión Acumulada</span>
                      <p className="text-base font-bold text-slate-900">${totalInvestment.toLocaleString('es-CO')}</p>
                    </div>
                  </div>

                  {/* Formulario de Novedad Diaria */}
                  {batch.status === 'EN_ENGORDE' && (
                    <div className="pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-600" />
                        Registrar Consumo y Bajas del Día
                      </h4>
                      <DailyLogForm batchId={batch.id} />
                    </div>
                  )}

                  {/* Historial con fechas y costos serializados */}
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