export const instant = false;

import Link from 'next/link';
import { ArrowLeft, DollarSign, CheckCircle2, Clock, Trash2, Fish, Scale } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { deleteFishHarvest, markFishHarvestAsPaid, closeFishBatch } from '../actions';
import { FishSaleForm } from './FishSaleForm';

export default async function PisciculturaVentasPage() {
  const [activeBatches, harvests] = await Promise.all([
    prisma.fishBatch.findMany({
      where: { status: 'ENGORDE' },
      orderBy: { createdAt: 'desc' },
      include: {
        dailyLogs: true,
        harvests: true,
      },
    }),
    prisma.fishHarvest.findMany({
      orderBy: { date: 'desc' },
      include: {
        batch: {
          select: { pondCode: true, species: true },
        },
      },
    }),
  ]);

  // Métricas acumuladas
  const totalKgSold = harvests.reduce((acc, h) => acc + Number(h.totalKg), 0);
  const totalFishCount = harvests.reduce((acc, h) => acc + h.fishCount, 0);
  const totalSalesRevenue = harvests.reduce((acc, h) => acc + Number(h.totalPrice), 0);

  const totalCollected = harvests
    .filter((h) => h.paymentStatus === 'PAGADO')
    .reduce((acc, h) => acc + Number(h.totalPrice), 0);

  const totalPending = harvests
    .filter((h) => h.paymentStatus !== 'PAGADO')
    .reduce((acc, h) => acc + Number(h.totalPrice), 0);

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
                <DollarSign className="w-5 h-5 text-emerald-700" />
                Ventas y Fiados (Piscicultura)
              </h1>
              <p className="text-xs text-slate-500">
                Liquidación de cosechas por kilo, cobros de contado y cartera de pescado
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Tarjetas Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> KILOS COSECHADOS / VENDIDOS
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalKgSold.toFixed(1)} <span className="text-base font-normal text-slate-500">Kg</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {totalFishCount > 0 ? `${totalFishCount} peces cosechados` : 'Ventas por peso'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">VENTAS TOTALES</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ${totalSalesRevenue.toLocaleString('es-CO')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {totalKgSold > 0
                ? `Promedio: $${Math.round(totalSalesRevenue / totalKgSold).toLocaleString('es-CO')}/Kg`
                : 'Sin despachos'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="text-xs text-emerald-900 font-semibold">COBRADO (EFECTIVO / CAJA)</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              ${totalCollected.toLocaleString('es-CO')}
            </p>
            <span className="text-[11px] text-emerald-700 mt-1 block font-medium">Flujo recibido</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <span className="text-xs text-amber-900 font-semibold">POR COBRAR (FIADOS)</span>
            <p className="text-2xl font-black text-amber-900 mt-1">
              ${totalPending.toLocaleString('es-CO')}
            </p>
            <span className="text-[11px] text-amber-800 mt-1 block font-medium">Cuentas pendientes</span>
          </div>
        </div>

        {/* Formulario y Liquidación por Estanque */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <FishSaleForm
              batches={activeBatches.map((b) => ({
                id: b.id,
                pondCode: b.pondCode,
                species: b.species,
                currentQuantity: b.currentQuantity,
                currentAvgWeight: Number(b.currentAvgWeight),
              }))}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Estado de Liquidación por Estanque */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Estado de Liquidación por Estanque</h2>
              <div className="space-y-3">
                {activeBatches.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No hay estanques activos en engorde.</p>
                ) : (
                  activeBatches.map((batch) => {
                    const totalFeedCost = batch.dailyLogs.reduce((acc, log) => acc + Number(log.feedCost || 0), 0);
                    const investment = Number(batch.seedCostTotal) + totalFeedCost;
                    const salesTotal = batch.harvests.reduce((acc, h) => acc + Number(h.totalPrice), 0);
                    const profit = salesTotal - investment;
                    const kgHarvested = batch.harvests.reduce((acc, h) => acc + Number(h.totalKg), 0);

                    return (
                      <div
                        key={batch.id}
                        className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{batch.pondCode}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-900 rounded-full">
                              {batch.currentQuantity} peces vivos
                            </span>
                            <span className="text-xs font-medium text-slate-500">({batch.species})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Inversión: <strong>${investment.toLocaleString('es-CO')}</strong> | Cosechado:{' '}
                            <strong className="text-slate-800">{kgHarvested.toFixed(1)} Kg</strong> | Ventas:{' '}
                            <strong>${salesTotal.toLocaleString('es-CO')}</strong> | Margen:{' '}
                            <span className={profit >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                              ${profit.toLocaleString('es-CO')}
                            </span>
                          </p>
                        </div>

                        <form
                          action={async () => {
                            'use server';
                            await closeFishBatch(batch.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Liquidar Estanque
                          </button>
                        </form>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Historial de Ventas y Cartera */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">Historial de Ventas y Cartera</h2>
              </div>

              {harvests.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Fish className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-600" />
                  <p className="text-xs font-medium">No hay despachos de pescado registrados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Estanque</th>
                        <th className="py-2.5 px-3">Kilos</th>
                        <th className="py-2.5 px-3">Peces</th>
                        <th className="py-2.5 px-3">Total ($)</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {harvests.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                            {new Date(h.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{h.batch.pondCode}</td>
                          <td className="py-2.5 px-3 font-black text-sky-950">{Number(h.totalKg)} Kg</td>
                          <td className="py-2.5 px-3">{h.fishCount > 0 ? `${h.fishCount} und` : '-'}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-800">
                            ${Number(h.totalPrice).toLocaleString('es-CO')}
                          </td>
                          <td className="py-2.5 px-3">
                            {h.paymentStatus === 'PAGADO' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Pagado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Fiado
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{h.customer || 'Venta mostrador'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {h.paymentStatus !== 'PAGADO' && (
                                <form
                                  action={async () => {
                                    'use server';
                                    await markFishHarvestAsPaid(h.id);
                                  }}
                                >
                                  <button
                                    type="submit"
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition cursor-pointer"
                                  >
                                    Cobrar
                                  </button>
                                </form>
                              )}
                              <form
                                action={async () => {
                                  'use server';
                                  await deleteFishHarvest(h.id);
                                }}
                              >
                                <button
                                  type="submit"
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                  title="Eliminar venta"
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