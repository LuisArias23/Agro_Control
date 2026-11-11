export const instant = false;

import Link from 'next/link';
import { ArrowLeft, PlusCircle, Calendar, DollarSign, Archive } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { createSwineBatch } from './actions';
import { SwineTabsView } from './SwineTabsView';

export default async function PorciculturaPage() {
  const [sows, batches, closedBatchesCount] = await Promise.all([
    prisma.swineSow.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        farrowings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.swineBatch.findMany({
      where: { status: 'ACTIVO' },
      orderBy: { createdAt: 'desc' },
      include: {
        dailyLogs: { orderBy: { date: 'desc' } },
        sales: { orderBy: { date: 'desc' } },
      },
    }),
    prisma.swineBatch.count({ where: { status: 'LIQUIDADO' } }),
  ]);

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
                <span className="text-xl">🐷</span>
                Porcicultura Integral
              </h1>
              <p className="text-xs text-slate-500">Maternidad, lechones destetados y corrales de ceba</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/Porcicultura/historial"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
            >
              <Archive className="w-4 h-4 text-slate-500" />
              Historial ({closedBatchesCount})
            </Link>

            <Link
              href="/Porcicultura/ventas"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition"
            >
              <DollarSign className="w-4 h-4" />
              Ventas y Despachos
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario Ingreso Lote Manual / Externo */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-rose-600" />
              Ingresar Lote Directo
            </h2>
            <form action={createSwineBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identificador / Corral</label>
                <input
                  type="text"
                  name="batchCode"
                  placeholder="Ej: CEBA-CORRAL-1"
                  required
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa de Entrada</label>
                  <select name="stage" defaultValue="CEBA_ENGORDE" className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white font-medium">
                    <option value="DESTETE_PRECEBO">Destete / Precebo</option>
                    <option value="CEBA_ENGORDE">Ceba / Engorde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Origen</label>
                  <select name="origin" defaultValue="GRANJA" className="w-full text-xs px-2.5 py-2 border rounded-lg bg-white font-medium">
                    <option value="GRANJA">Nacido en Granja</option>
                    <option value="COMPRA_EXTERNA">Compra Externa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Cerdos</label>
                  <input
                    type="number"
                    name="initialQuantity"
                    placeholder="10"
                    min="1"
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peso Entrada (Kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="initialAvgWeight"
                    defaultValue="10.0"
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Entrada</label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Compra ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchaseCostTotal"
                    defaultValue="0"
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-700 hover:bg-rose-800 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-xs mt-2 cursor-pointer"
              >
                Guardar Lote
              </button>
            </form>
          </div>
        </div>

        {/* Vista Integral de las 3 Fases */}
        <div className="lg:col-span-2">
          <SwineTabsView
            sows={sows.map((s) => ({
              id: s.id,
              code: s.code,
              breed: s.breed,
              status: s.status,
              entryDate: s.entryDate.toISOString(),
              farrowings: s.farrowings.map((f) => ({
                id: f.id,
                matingDate: f.matingDate ? f.matingDate.toISOString() : null,
                expectedDate: f.expectedDate ? f.expectedDate.toISOString() : null,
                farrowingDate: f.farrowingDate ? f.farrowingDate.toISOString() : null,
                bornAlive: f.bornAlive,
                bornDead: f.bornDead,
                weanedCount: f.weanedCount,
              })),
            }))}
            batches={batches.map((b) => ({
              id: b.id,
              batchCode: b.batchCode,
              stage: b.stage,
              startDate: b.startDate.toISOString(),
              initialQuantity: b.initialQuantity,
              currentQuantity: b.currentQuantity,
              initialAvgWeight: Number(b.initialAvgWeight),
              currentAvgWeight: Number(b.currentAvgWeight),
              purchaseCostTotal: Number(b.purchaseCostTotal),
              origin: b.origin,
              dailyLogs: b.dailyLogs.map((l) => ({
                mortalityCount: l.mortalityCount,
                feedKgServed: Number(l.feedKgServed),
                feedCost: Number(l.feedCost || 0),
              })),
              sales: b.sales.map((s) => ({
                pigsSold: s.pigsSold,
                totalPrice: Number(s.totalPrice),
              })),
            }))}
          />
        </div>
      </main>
    </div>
  );
}