'use client';

import { useState, useTransition } from 'react';
import { DollarSign, ChevronDown, ChevronUp, ShoppingBag, Trash2, CheckCircle2, RotateCcw } from 'lucide-react';
import { addPoultrySale, deletePoultrySale, closePoultryBatch, reopenPoultryBatch } from './actions';

export interface PoultrySaleItem {
  id: string;
  date: string;
  birdsSold: number;
  saleType: string;
  totalWeight: number;
  totalPrice: number;
  customer: string | null;
  notes: string | null;
}

interface PoultrySalesModalProps {
  batchId: string;
  batchCode: string;
  currentQuantity: number;
  status: string;
  totalCost: number; // Costo pollito + costo alimento
  sales: PoultrySaleItem[];
}

export function PoultrySalesModal({
  batchId,
  batchCode,
  currentQuantity,
  status,
  totalCost,
  sales,
}: PoultrySalesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalIncome = sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalBirdsSold = sales.reduce((acc, s) => acc + s.birdsSold, 0);
  const netProfit = totalIncome - totalCost;

  const handleCreateSale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addPoultrySale(formData);
      setShowSaleForm(false);
    });
  };

  const handleDeleteSale = (saleId: string) => {
    if (confirm('¿Eliminar esta saca y devolver las aves a la población viva?')) {
      startTransition(async () => {
        await deletePoultrySale(saleId);
      });
    }
  };

  const handleCloseBatch = () => {
    if (confirm(`¿Liquidar y cerrar definitivamente el ${batchCode}? No podrás registrar más consumos a menos que lo reabras.`)) {
      startTransition(async () => {
        await closePoultryBatch(batchId);
      });
    }
  };

  const handleReopen = () => {
    if (confirm(`¿Deseas reabrir el ${batchCode} para continuar registrando novedades?`)) {
      startTransition(async () => {
        await reopenPoultryBatch(batchId);
      });
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-950 rounded-lg text-xs font-bold transition"
      >
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-700" />
          Sacas Parciales y Liquidación ({sales.length} ventas / ${totalIncome.toLocaleString('es-CO')})
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-700" /> : <ChevronDown className="w-4 h-4 text-emerald-700" />}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-white border border-emerald-200 rounded-xl space-y-4 shadow-sm">
          {/* Resumen financiero en vivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500">Aves Sacadas</span>
              <p className="text-sm font-black text-slate-900">{totalBirdsSold} aves</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500">Ingresos Ventas</span>
              <p className="text-sm font-black text-emerald-700">${totalIncome.toLocaleString('es-CO')}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-500">Costos Lote</span>
              <p className="text-sm font-black text-slate-700">${totalCost.toLocaleString('es-CO')}</p>
            </div>
            <div className={`p-2.5 rounded-lg border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-600">Balance / Utilidad</span>
              <p className={`text-sm font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                ${netProfit.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {status === 'EN_ENGORDE' ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaleForm(!showSaleForm)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {showSaleForm ? 'Cerrar Formulario' : '+ Registrar Saca / Venta'}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCloseBatch}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Liquidar Lote Completo
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between bg-slate-100 p-2.5 rounded-lg">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Este lote se encuentra liquidado y cerrado.
                </span>
                <button
                  type="button"
                  onClick={handleReopen}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reabrir
                </button>
              </div>
            )}
          </div>

          {/* Formulario de registro de saca parcial */}
          {showSaleForm && status === 'EN_ENGORDE' && (
            <form onSubmit={handleCreateSale} className="p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-950">Registrar Sacrificio o Venta de Aves</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Pollos Sacados</label>
                  <input
                    type="number"
                    name="birdsSold"
                    placeholder={`Máx ${currentQuantity}`}
                    max={currentQuantity}
                    min="1"
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Modalidad</label>
                  <select
                    name="saleType"
                    className="w-full text-xs px-2 py-1.5 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="EN_PIE">En Pie (Vivo)</option>
                    <option value="CANAL">En Canal (Beneficiado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Peso Total (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="totalWeight"
                    placeholder="Ej: 85.5 Kg"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Valor Total Venta ($)</label>
                  <input
                    type="number"
                    name="totalPrice"
                    placeholder="Ej: 450000"
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Cliente / Destino</label>
                  <input
                    type="text"
                    name="customer"
                    placeholder="Ej: Distribuidor / Local"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaleForm(false)}
                  className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition"
                >
                  {isPending ? 'Guardando...' : 'Guardar Saca'}
                </button>
              </div>
            </form>
          )}

          {/* Tabla de sacas realizadas */}
          {sales.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Cantidad</th>
                    <th className="py-2 px-3">Modalidad</th>
                    <th className="py-2 px-3">Kilos</th>
                    <th className="py-2 px-3">Ingreso ($)</th>
                    <th className="py-2 px-3">Destino</th>
                    <th className="py-2 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                        {new Date(sale.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{sale.birdsSold} aves</td>
                      <td className="py-2 px-3 text-slate-600">{sale.saleType === 'EN_PIE' ? 'En Pie' : 'Canal'}</td>
                      <td className="py-2 px-3 text-slate-700">{sale.totalWeight > 0 ? `${sale.totalWeight} Kg` : '-'}</td>
                      <td className="py-2 px-3 font-bold text-emerald-700">${sale.totalPrice.toLocaleString('es-CO')}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">{sale.customer || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Eliminar saca y devolver aves"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}