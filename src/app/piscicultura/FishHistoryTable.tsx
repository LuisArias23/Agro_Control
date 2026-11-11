'use client';

import { useState, useTransition } from 'react';
import { History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { deleteFishDailyLog, deleteFishHarvest } from './actions';

interface DailyLogItem {
  id: string;
  date: string;
  mortalityCount: number;
  feedKgServed: number;
  proteinPercentage: number | null;
  feedCost: number;
  notes: string | null;
}

interface HarvestItem {
  id: string;
  date: string;
  fishCount: number;
  totalKg: number;
  totalPrice: number;
  paymentStatus: string;
  customer: string | null;
}

export function FishHistoryTable({ logs, harvests }: { logs: DailyLogItem[]; harvests: HarvestItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'harvests'>('feed');
  const [isPending, startTransition] = useTransition();

  const handleDeleteLog = (id: string) => {
    if (confirm('¿Eliminar este registro diario? Se restaurarán los peces si hubo bajas.')) {
      startTransition(async () => {
        await deleteFishDailyLog(id);
      });
    }
  };

  const handleDeleteHarvest = (id: string) => {
    if (confirm('¿Eliminar esta cosecha? Se devolverán los peces al estanque.')) {
      startTransition(async () => {
        await deleteFishHarvest(id);
      });
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          Historial de Operaciones ({logs.length} registros / {harvests.length} cosechas)
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                activeTab === 'feed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Alimento y Bajas ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('harvests')}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                activeTab === 'harvests' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cosechas y Ventas ({harvests.length})
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            {activeTab === 'feed' ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Bajas</th>
                    <th className="py-2.5 px-3">Alimento</th>
                    <th className="py-2.5 px-3">% Prot.</th>
                    <th className="py-2.5 px-3">Gasto</th>
                    <th className="py-2.5 px-3">Notas</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-400">Sin registros diarios.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium">
                          {new Date(log.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.mortalityCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">-{log.mortalityCount}</span>
                          ) : '0'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{log.feedKgServed} Kg</td>
                        <td className="py-2.5 px-3">{log.proteinPercentage ? `${log.proteinPercentage}%` : '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-800">${log.feedCost.toLocaleString('es-CO')}</td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">{log.notes || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => handleDeleteLog(log.id)} className="text-slate-400 hover:text-rose-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Kilos Cosechados</th>
                    <th className="py-2.5 px-3">Peces</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Total ($)</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {harvests.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-400">Sin cosechas registradas.</td></tr>
                  ) : (
                    harvests.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium">
                          {new Date(h.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-950">{h.totalKg} Kg</td>
                        <td className="py-2.5 px-3">{h.fishCount}</td>
                        <td className="py-2.5 px-3">{h.customer || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-800">${h.totalPrice.toLocaleString('es-CO')}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.paymentStatus === 'PAGADO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {h.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button onClick={() => handleDeleteHarvest(h.id)} className="text-slate-400 hover:text-rose-600 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}