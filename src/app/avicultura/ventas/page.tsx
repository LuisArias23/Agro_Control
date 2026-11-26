export const instant = false;

import Link from 'next/link';
import { DollarSign, PlusCircle, Trash2, Check, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { addPoultrySale, deletePoultrySale, closePoultryBatch, markSaleAsPaid } from '../actions';
import { BackButton } from '../BackButton';

export default async function PollosVentasPage() {
  const [activeBatches, operationalSales] = await Promise.all([
    prisma.poultryBatch.findMany({
      where: { status: 'EN_ENGORDE' },
      include: {
        dailyLogs: true,
        sales: true,
      },
      orderBy: { startDate: 'asc' },
    }),
    prisma.poultrySale.findMany({
      where: {
        OR: [
          { batch: { status: 'EN_ENGORDE' } },
          { paymentStatus: 'FIADO' },
        ],
      },
      orderBy: { date: 'desc' },
      include: { batch: true },
    }),
  ]);

  const now = Date.now();
  const getBatchAgeDays = (startDate: Date) =>
    Math.max(0, Math.floor((now - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));

  const activeSalesOnly = operationalSales.filter(s => s.batch.status === 'EN_ENGORDE');
  const totalSoldIncome = activeSalesOnly.reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalCollected = activeSalesOnly
    .filter(s => s.paymentStatus === 'PAGADO')
    .reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalPendingDebt = operationalSales
    .filter(s => s.paymentStatus === 'FIADO')
    .reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalBirdsSold = activeSalesOnly.reduce((acc, s) => acc + s.birdsSold, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Cabecera */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton href="/avicultura" />
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Ventas y Despachos (Lotes Activos)
              </h1>
              <p className="text-xs text-slate-500">Control de sacas en pie/canal, congelador, fiados y liquidación</p>
            </div>
          </div>

          <Link
            href="/avicultura/historial"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
          >
            Ver Historial Liquidado →
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Métricas de Caja y Cartera (Lotes Activos) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Aves Despachadas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalBirdsSold} <span className="text-xs font-normal text-slate-400">pollos</span>
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Ventas Activas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">${totalSoldIncome.toLocaleString('es-CO')}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-800 uppercase">Cobrado (Efectivo / Caja)</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">${totalCollected.toLocaleString('es-CO')}</p>
          </div>
          <div className={`p-4 rounded-xl border shadow-sm ${totalPendingDebt > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
            <span className="text-xs font-semibold text-amber-800 uppercase">Por Cobrar (Fiados)</span>
            <p className={`text-2xl font-black mt-1 ${totalPendingDebt > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              ${totalPendingDebt.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Registro de Venta */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Registrar Saca / Venta
              </h2>

              {activeBatches.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed rounded-lg text-xs text-slate-500 text-center">
                  No hay lotes en engorde activos para despachar aves.
                </div>
              ) : (
                <form action={addPoultrySale} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Seleccionar Lote de Origen</label>
                    <select
                      name="batchId"
                      defaultValue={activeBatches[0]?.id}
                      required
                      className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      {activeBatches.map(b => {
                        const ageDays = getBatchAgeDays(b.startDate);
                        const freezerQty = b.freezerQuantity || 0;
                        const stageLabel = ageDays >= 42 ? 'Listo / En saca' : `Día ${ageDays}`;
                        return (
                          <option key={b.id} value={b.id}>
                            {b.batchCode} ({freezerQty} congelador · {b.currentQuantity} vivos · {stageLabel})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad Pollos</label>
                      <input
                        type="number"
                        name="birdsSold"
                        placeholder="Ej: 20"
                        min="1"
                        required
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Modalidad</label>
                      <select
                        name="saleType"
                        className="w-full text-xs px-2 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="CANAL">En Canal (Congelador)</option>
                        <option value="EN_PIE">En Pie (Vivo)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Kilos Totales</label>
                      <input
                        type="number"
                        step="0.1"
                        name="totalWeight"
                        placeholder="Ej: 45.5"
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Valor Venta ($)</label>
                      <input
                        type="number"
                        name="totalPrice"
                        placeholder="Ej: 360000"
                        required
                        className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Forma de Pago</label>
                    <select
                      name="paymentStatus"
                      className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                    >
                      <option value="PAGADO">Contado (Pagado inmediatamente)</option>
                      <option value="FIADO">Fiado (Pendiente de cobro)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cliente / Detalle</label>
                    <input
                      type="text"
                      name="customer"
                      placeholder="Nombre del cliente o destino"
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Guardar Saca / Venta
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Listado de Lotes Activos para Liquidar y Cartera */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de Liquidación por Lote Activo */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Lotes Activos en Engorde / Saca</h3>
                <span className="text-[11px] text-slate-500">Al liquidar, el lote pasa al historial</span>
              </div>

              {activeBatches.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  Todos los lotes han sido liquidados y archivados en el historial.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBatches.map(batch => {
                    const feedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
                    const totalCost = Number(batch.chickCostTotal) + feedCost;
                    const totalSales = batch.sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
                    const profit = totalSales - totalCost;
                    const ageDays = getBatchAgeDays(batch.startDate);
                    const freezerQty = batch.freezerQuantity || 0;
                    const isReady = ageDays >= 42 || freezerQty > 0;

                    return (
                      <div
                        key={batch.id}
                        className={`p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isReady ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{batch.batchCode}</span>
                            {freezerQty > 0 && (
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-100 text-sky-800">
                                ❄️ {freezerQty} en congelador
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {batch.currentQuantity} vivos · {isReady ? 'Listo / En saca' : `Día ${ageDays}`}
                            </span>
                          </div>
                          <p className="text-slate-500 mt-0.5">
                            Inversión: ${totalCost.toLocaleString('es-CO')} | Ventas: ${totalSales.toLocaleString('es-CO')} | Utilidad:{' '}
                            <strong className={profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              ${profit.toLocaleString('es-CO')}
                            </strong>
                          </p>
                        </div>

                        <form
                          action={async () => {
                            'use server';
                            await closePoultryBatch(batch.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
                          >
                            Liquidar Lote
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historial de Ventas Activas y Fiados Pendientes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Ventas Activas y Cartera por Cobrar</h3>

              {operationalSales.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  No hay ventas activas ni fiados pendientes por cobrar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Lote</th>
                        <th className="py-2.5 px-3">Cantidad</th>
                        <th className="py-2.5 px-3">Modalidad</th>
                        <th className="py-2.5 px-3">Kilos</th>
                        <th className="py-2.5 px-3">Total ($)</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {operationalSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                            {new Date(sale.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {sale.batch.batchCode}
                            {sale.batch.status === 'LIQUIDADO' && (
                              <span className="ml-1 text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                Liquidado
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">{sale.birdsSold} aves</td>
                          <td className="py-2 px-3 text-slate-600">{sale.saleType === 'EN_PIE' ? 'En Pie' : 'Canal'}</td>
                          <td className="py-2 px-3">{Number(sale.totalWeight) > 0 ? `${Number(sale.totalWeight)} Kg` : '-'}</td>
                          <td className="py-2 px-3 font-bold text-emerald-700">${Number(sale.totalPrice).toLocaleString('es-CO')}</td>
                          <td className="py-2 px-3">
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
                          <td className="py-2 px-3 font-medium text-slate-700 truncate max-w-[120px]">{sale.customer || '-'}</td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {sale.paymentStatus === 'FIADO' && (
                                <form
                                  action={async () => {
                                    'use server';
                                    await markSaleAsPaid(sale.id);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded transition cursor-pointer"
                                  >
                                    Cobrar
                                  </button>
                                </form>
                              )}
                              {sale.batch.status === 'EN_ENGORDE' && (
                                <form
                                  action={async () => {
                                    'use server';
                                    await deletePoultrySale(sale.id);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                    title="Eliminar saca y devolver aves"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}