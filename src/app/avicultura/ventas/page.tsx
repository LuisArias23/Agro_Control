export const instant = false;

import Link from 'next/link';
import { ArrowLeft, DollarSign, PlusCircle, CheckCircle2, RotateCcw, Trash2, Check, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { addPoultrySale, deletePoultrySale, closePoultryBatch, reopenPoultryBatch, markSaleAsPaid } from '../actions';
import { BackButton } from '../BackButton';

export default async function PollosVentasPage() {
  const [activeBatches, allSales, allBatches] = await Promise.all([
    prisma.poultryBatch.findMany({
      where: { status: 'EN_ENGORDE' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.poultrySale.findMany({
      orderBy: { date: 'desc' },
      include: { batch: true },
    }),
    prisma.poultryBatch.findMany({
      include: {
        dailyLogs: true,
        sales: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalSoldIncome = allSales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalCollected = allSales.filter(s => s.paymentStatus === 'PAGADO').reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalPendingDebt = allSales.filter(s => s.paymentStatus === 'FIADO').reduce((acc, s) => acc + Number(s.totalPrice), 0);
  const totalBirdsSold = allSales.reduce((acc, s) => acc + s.birdsSold, 0);

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
                Ventas y Despachos (Pollos de Engorde)
              </h1>
              <p className="text-xs text-slate-500">Control de sacas en pie/canal, ventas al detal, fiados y liquidación</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Métricas de Caja y Cartera */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Aves Despachadas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalBirdsSold} <span className="text-xs font-normal text-slate-400">pollos</span></p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Ventas Totales</span>
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
                      required
                      className="w-full text-xs px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      {activeBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchCode} ({b.currentQuantity} aves vivas disponibles)
                        </option>
                      ))}
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
                        <option value="CANAL">En Canal</option>
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

          {/* Listado de Ventas Realizadas y Liquidación de Lotes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de Liquidación por Lote */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Estado de Liquidación por Lote</h3>
              <div className="space-y-3">
                {allBatches.map(batch => {
                  const feedCost = batch.dailyLogs.reduce((acc, l) => acc + Number(l.feedCost || 0), 0);
                  const totalCost = Number(batch.chickCostTotal) + feedCost;
                  const totalSales = batch.sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
                  const profit = totalSales - totalCost;

                  return (
                    <div key={batch.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{batch.batchCode}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${batch.status === 'EN_ENGORDE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                            {batch.status === 'EN_ENGORDE' ? `${batch.currentQuantity} aves vivas` : 'LIQUIDADO'}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">
                          Inversión: ${totalCost.toLocaleString('es-CO')} | Ventas: ${totalSales.toLocaleString('es-CO')} | Utilidad: <strong className={profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>${profit.toLocaleString('es-CO')}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {batch.status === 'EN_ENGORDE' ? (
                          <form action={async () => {
                            'use server';
                            await closePoultryBatch(batch.id);
                          }}>
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition"
                            >
                              Liquidar Lote
                            </button>
                          </form>
                        ) : (
                          <form action={async () => {
                            'use server';
                            await reopenPoultryBatch(batch.id);
                          }}>
                            <button
                              type="submit"
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded transition flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Reabrir
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historial de Sacas / Ventas con Botón de Cobro de Fiados */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Historial de Ventas y Cartera</h3>

              {allSales.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-lg">
                  No se han registrado ventas ni sacas todavía.
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
                      {allSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                            {new Date(sale.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{sale.batch.batchCode}</td>
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
                                <form action={async () => {
                                  'use server';
                                  await markSaleAsPaid(sale.id);
                                }}>
                                  <button
                                    type="submit"
                                    className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded transition"
                                  >
                                    Cobrar
                                  </button>
                                </form>
                              )}
                              <form action={async () => {
                                'use server';
                                await deletePoultrySale(sale.id);
                              }}>
                                <button
                                  type="submit"
                                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                                  title="Eliminar saca y devolver aves al lote"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </form>
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