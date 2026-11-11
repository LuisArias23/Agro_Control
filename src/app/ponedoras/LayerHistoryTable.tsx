'use client';

import { useState, useTransition } from 'react';
import { History, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { deleteLayerDailyLog } from './actions';

interface LayerLogItem {
  id: string;
  date: string;
  eggsCollected: number;
  eggsBroken: number;
  mortalityCount: number;
  feedKgServed: number;
  notes: string | null;
}

export function LayerHistoryTable({ logs }: { logs: LayerLogItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este registro? Si hubo bajas, se devolverán al lote.')) {
      startTransition(async () => {
        await deleteLayerDailyLog(id);
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
          Historial de Registros ({logs.length})
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          {logs.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">No hay registros anotados todavía.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Huevos Aptos</th>
                  <th className="py-2.5 px-3">Rotos/Sucios</th>
                  <th className="py-2.5 px-3">Bajas</th>
                  <th className="py-2.5 px-3">Alimento</th>
                  <th className="py-2.5 px-3">Notas</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                      {new Date(log.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-amber-950">
                      {log.eggsCollected} <span className="font-normal text-slate-400 text-[10px]">({(log.eggsCollected / 30).toFixed(1)} pnl)</span>
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">{log.eggsBroken}</td>
                    <td className="py-2.5 px-3">
                      {log.mortalityCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                          -{log.mortalityCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {log.feedKgServed > 0 ? `${log.feedKgServed} Kg` : <span className="text-slate-400">0 Kg</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate" title={log.notes || ''}>
                      {log.notes || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(log.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}