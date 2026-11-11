export const instant = false;

import Link from 'next/link';
import { ArrowLeft, DollarSign, CheckCircle2, Clock, Trash2, Scale } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import {deleteSwineSale , markSwineSaleAsPaid } from '../actions';

export default async function PorciculturaVentasPage() {
  const sales = await prisma.swineSale.findMany({
    orderBy: { date: 'desc' },
    include: {
      batch: { select: { batchCode: true } },
    },
  });

  const totalKgSold = sales.reduce((acc, s) => acc + Number(s.totalWeightKg), 0);
  const totalPigsSold = sales.reduce((acc, s) => acc + s.pigsSold, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);

  const totalCollected = sales
    .filter((s) => s.paymentStatus === 'PAGADO')
    .reduce((acc, s) => acc + Number(s.totalPrice), 0);

  const totalPending = sales
    .filter((s) => s.paymentStatus !== 'PAGADO')
    .reduce((acc, s) => acc + Number(s.totalPrice), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/Porcicultura"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-700" />
                Ventas y Despachos de Cerdos
              </h1>
              <p className="text-xs text-slate-500">Liquidación en pie, canal, destino charcutería y cartera</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> KILOS DESPACHADOS
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalKgSold.toFixed(1)} <span className="text-base font-normal text-slate-500">Kg</span>
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">{totalPigsSold} cerdos comercializados</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">VENTAS TOTALES</span>
            <p className="text-2xl font-black text-slate-900 mt-1">${totalRevenue.toLocaleString('es-CO')}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {totalKgSold > 0 ? `Promedio: $${Math.round(totalRevenue / totalKgSold).toLocaleString('es-CO')}/Kg` : '-'}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="text-xs text-emerald-900 font-semibold">COBRADO (CAJA / TRANSFERENCIA)</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">${totalCollected.toLocaleString('es-CO')}</p>
            <span className="text-[11px] text-emerald-700 mt-1 block font-medium">Flujo recibido</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
            <span className="text-xs text-amber-900 font-semibold">POR COBRAR (FIADOS)</span>
            <p className="text-2xl font-black text-amber-900 mt-1">${totalPending.toLocaleString('es-CO')}</p>
            <span className="text-[11px] text-amber-800 mt-1 block font-medium">Cartera activa</span>
          </div>
        </div>

        {/* Tabla de Ventas */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Historial de Despachos</h2>
          </div>

          {sales.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-xs font-medium">No hay despachos de cerdos registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Corral</th>
                    <th className="py-2.5 px-3">Cerdos</th>
                    <th className="py-2.5 px-3">Kilos</th>
                    <th className="py-2.5 px-3">Modalidad</th>
                    <th className="py-2.5 px-3">Total ($)</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                        {new Date(s.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.batch.batchCode}</td>
                      <td className="py-2.5 px-3 font-semibold">{s.pigsSold} und</td>
                      <td className="py-2.5 px-3 font-black text-rose-950">{Number(s.totalWeightKg)} Kg</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.saleType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">
                        ${Number(s.totalPrice).toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{s.customer || '-'}</td>
                      <td className="py-2.5 px-3">
                        {s.paymentStatus === 'PAGADO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Pagado
                          </span>
                        ) : (
                          <form
                            action={async () => {
                              'use server';
                              await markSwineSaleAsPaid(s.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-emerald-100 hover:text-emerald-900 transition cursor-pointer"
                            >
                              <Clock className="w-3 h-3 text-amber-600" /> Fiado (Cobrar)
                            </button>
                          </form>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <form
                          action={async () => {
                            'use server';
                            await deleteSwineSale(s.id);
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}