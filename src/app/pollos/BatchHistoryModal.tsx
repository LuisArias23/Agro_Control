'use client';

import { useState, useTransition } from 'react';
import { History, ChevronDown, ChevronUp, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { deleteDailyLog } from './actions';

export interface DailyLogItem {
  id: string;
  date: string;
  mortalityCount: number;
  feedKgServed: number;
  feedCost: number;
  feedBrand?: string;
  notes: string | null;
}

interface BatchHistoryModalProps {
  logs: DailyLogItem[];
  batchCode: string;
}

export function BatchHistoryModal({ logs }: BatchHistoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este registro? Si tenía bajas, se devolverán al lote.')) {
      startTransition(async () => {
        await deleteDailyLog(id);
      });
    }
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
      >
        <span className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-amber-600" />
          Historial de Registros ({logs.length})
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-inner">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              No hay registros diarios guardados para este lote aún.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Bajas</th>
                    <th className="py-2 px-3">Alimento</th>
                    <th className="py-2 px-3">Gasto ($)</th>
                    <th className="py-2 px-3">Detalle</th>
                    <th className="py-2 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const logDate = new Date(log.date);
                    const formattedDate = logDate.toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </td>
                        <td className="py-2 px-3">
                          {log.mortalityCount > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              -{log.mortalityCount}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {log.feedKgServed.toFixed(1)} Kg
                        </td>
                        <td className="py-2 px-3 font-semibold text-amber-700">
                          ${log.feedCost > 0 ? log.feedCost.toLocaleString('es-CO') : '0'}
                        </td>
                        <td className="py-2 px-3 text-slate-500 max-w-[160px] truncate" title={log.notes || ''}>
                          {log.notes || '-'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Eliminar este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}