'use client';

import { useState, useTransition } from 'react';
import { DollarSign, X, Check, Trash2, ShoppingCart } from 'lucide-react';
import { addLayerEggSale, deleteLayerEggSale, markEggSaleAsPaid } from './actions';

interface EggSaleItem {
  id: string;
  date: string;
  panalesSold: number;
  unitsSold: number;
  totalAmount: number;
  customerName: string | null;
  isPaid: boolean;
}

interface EggSalesModalProps {
  batchId: string;
  batchCode: string;
  availableEggs: number;
  sales: EggSaleItem[];
}

export function EggSalesModal({ batchId, batchCode, availableEggs, sales }: EggSalesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [saleType, setSaleType] = useState<'PANAL' | 'UNIDAD'>('PANAL');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('18000'); // Precio sugerido por panal
  const [customerName, setCustomerName] = useState('');
  const [isPaid, setIsPaid] = useState('true');

  const availablePanales = (availableEggs / 30).toFixed(1);
  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  const handleSaleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('batchId', batchId);
    formData.append('saleType', saleType);
    formData.append('quantity', quantity);
    formData.append('totalAmount', totalAmount.toString());
    formData.append('customerName', customerName);
    formData.append('isPaid', isPaid);

    startTransition(async () => {
      await addLayerEggSale(formData);
      setQuantity('');
      setCustomerName('');
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta venta? Los huevos se reintegrarán al stock disponible.')) {
      startTransition(async () => {
        await deleteLayerEggSale(id);
      });
    }
  };

  const handleMarkPaid = (id: string) => {
    startTransition(async () => {
      await markEggSaleAsPaid(id);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs transition cursor-pointer"
      >
        <DollarSign className="w-3.5 h-3.5" />
        Venta de Huevos
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-700" />
                  Ventas y Despacho de Huevos ({batchCode})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stock disponible: <strong className="text-amber-900 font-bold">{availableEggs} huevos</strong> ({availablePanales} panales)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario de Venta */}
            <form onSubmit={handleSaleSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Registrar Salida / Venta
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Presentación</label>
                  <select
                    value={saleType}
                    onChange={(e) => {
                      const mode = e.target.value as 'PANAL' | 'UNIDAD';
                      setSaleType(mode);
                      setUnitPrice(mode === 'PANAL' ? '18000' : '600');
                    }}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="PANAL">Panal (30 Und)</option>
                    <option value="UNIDAD">Huevos Sueltos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Cantidad {saleType === 'PANAL' ? 'Panales' : 'Unidades'}
                  </label>
                  <input
                    type="number"
                    step={saleType === 'PANAL' ? '0.5' : '1'}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="0.1"
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Precio Unit ($)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Valor Total</label>
                  <div className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-100 font-bold text-emerald-800">
                    ${totalAmount.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cliente / Comprador</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Tienda Don Pedro, Particular"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Estado de Pago</label>
                  <select
                    value={isPaid}
                    onChange={(e) => setIsPaid(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
                  >
                    <option value="true">Pagado de Contado</option>
                    <option value="false">Pendiente de Cobro (Fiado)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Guardando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>

            {/* Tabla Histórica de Ventas */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Historial de Ventas ({sales.length})
              </span>
              {sales.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay ventas registradas en este lote.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Cantidad</th>
                        <th className="py-2 px-3">Cliente</th>
                        <th className="py-2 px-3">Total</th>
                        <th className="py-2 px-3">Estado</th>
                        <th className="py-2 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 whitespace-nowrap">
                            {new Date(sale.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {sale.panalesSold} panales <span className="text-[10px] font-normal text-slate-400">({sale.unitsSold} und)</span>
                          </td>
                          <td className="py-2 px-3">{sale.customerName || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-800">
                            ${Number(sale.totalAmount).toLocaleString('es-CO')}
                          </td>
                          <td className="py-2 px-3">
                            {sale.isPaid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Pagado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(sale.id)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-emerald-100 hover:text-emerald-900 transition cursor-pointer"
                                title="Clic para marcar como cobrado"
                              >
                                Fiado (Cobrar)
                              </button>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(sale.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
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
          </div>
        </div>
      )}
    </>
  );
}