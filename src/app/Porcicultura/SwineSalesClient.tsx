'use client';

import { useState, useTransition } from 'react';
import {
  DollarSign,
  Scale,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  Trash2,
  PlusCircle,
  X,
  Check,
  Search,
} from 'lucide-react';
import { addSwineSale, markSwineSaleAsPaid, deleteSwineSale } from '../../app/Porcicultura/actions';

interface BatchOption {
  id: string;
  batchCode: string;
  stage: string;
  currentQuantity: number;
  currentAvgWeight: number;
}

interface SaleRecord {
  id: string;
  date: string;
  batchCode: string;
  pigsSold: number;
  totalWeightKg: number;
  pricePerKg: number;
  totalPrice: number;
  saleType: string;
  paymentStatus: string;
  customer: string | null;
  notes: string | null;
}

export function SwineSalesClient({
  batches,
  initialSales,
}: {
  batches: BatchOption[];
  initialSales: SaleRecord[];
}) {
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Estados del formulario
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');
  const [saleType, setSaleType] = useState('EN_PIE');
  const [pigsSold, setPigsSold] = useState('1');
  const [totalWeightKg, setTotalWeightKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('9500');
  const [paymentStatus, setPaymentStatus] = useState('PAGADO');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');

  const handleChannelChange = (type: string) => {
    setSaleType(type);
    if (type === 'EN_PIE') {
      setPricePerKg('9500');
      setPigsSold('1');
    } else if (type === 'CANAL') {
      setPricePerKg('14500');
      setPigsSold('1');
    } else if (type === 'TIENDA_DETAL') {
      setPricePerKg('16000');
      setPigsSold('0'); // 0 cerdos enteros si es venta por porciones al mostrador
    } else if (type === 'LECHON_DESTETADO') {
      setPricePerKg('12000');
      setPigsSold('1');
    }
  };

  const computedTotal = (parseFloat(totalWeightKg) || 0) * (parseFloat(pricePerKg) || 0);

  const filteredSales = initialSales.filter((s) => {
    const matchType = filterType === 'TODOS' || s.saleType === filterType;
    const matchStatus = filterStatus === 'TODOS' || s.paymentStatus === filterStatus;
    const matchSearch =
      !searchQuery ||
      (s.customer && s.customer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchStatus && matchSearch;
  });

  const totalRecaudado = initialSales
    .filter((s) => s.paymentStatus === 'PAGADO')
    .reduce((acc, s) => acc + s.totalPrice, 0);

  const totalPorCobrar = initialSales
    .filter((s) => s.paymentStatus === 'FIADO')
    .reduce((acc, s) => acc + s.totalPrice, 0);

  const totalKilosVendidos = initialSales.reduce((acc, s) => acc + s.totalWeightKg, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('batchId', selectedBatchId);
    formData.append('saleType', saleType);
    formData.append('pigsSold', pigsSold);
    formData.append('totalWeightKg', totalWeightKg);
    formData.append('pricePerKg', pricePerKg);
    formData.append('paymentStatus', paymentStatus);
    formData.append('customer', customer);
    formData.append('notes', notes);

    startTransition(async () => {
      await addSwineSale(formData);
      setShowModal(false);
      setTotalWeightKg('');
      setCustomer('');
      setNotes('');
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumen Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pagado (Caja)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">${totalRecaudado.toLocaleString('es-CO')}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Cobrado en efectivo / transferencia</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Cartera Pendiente (Fiado)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">${totalPorCobrar.toLocaleString('es-CO')}</p>
          <span className="text-[11px] text-amber-800 font-medium">Por cobrar a clientes</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Kilos Totales Despachados</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950">{totalKilosVendidos.toFixed(1)} Kg</p>
          <span className="text-[11px] text-slate-500">{initialSales.length} ventas registradas</span>
        </div>
      </div>

      {/* Filtros y Acción Nueva Venta */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente o corral..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 border rounded-lg bg-white font-medium"
          >
            <option value="TODOS">Todos los Canales</option>
            <option value="EN_PIE">En Pie (Báscula)</option>
            <option value="CANAL">En Canal (Faenado)</option>
            <option value="TIENDA_DETAL">Al Detal en Tienda</option>
            <option value="LECHON_DESTETADO">Lechones</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 border rounded-lg bg-white font-medium"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PAGADO">Pagado</option>
            <option value="FIADO">Fiado</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Registrar Nueva Venta
        </button>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No hay registros de ventas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Corral</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Animales</th>
                  <th className="px-4 py-3 text-right">Kilos</th>
                  <th className="px-4 py-3 text-right">Precio / Kg</th>
                  <th className="px-4 py-3 text-right">Total ($)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{s.batchCode}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          s.saleType === 'EN_PIE'
                            ? 'bg-blue-100 text-blue-900'
                            : s.saleType === 'CANAL'
                            ? 'bg-purple-100 text-purple-900'
                            : s.saleType === 'TIENDA_DETAL'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {s.saleType === 'EN_PIE' && <Truck className="w-3 h-3" />}
                        {s.saleType === 'CANAL' && <Scale className="w-3 h-3" />}
                        {s.saleType === 'TIENDA_DETAL' && <Store className="w-3 h-3" />}
                        {s.saleType === 'EN_PIE'
                          ? 'En Pie'
                          : s.saleType === 'CANAL'
                          ? 'En Canal'
                          : s.saleType === 'TIENDA_DETAL'
                          ? 'Tienda Detal'
                          : 'Lechón'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.customer || <span className="text-slate-400 italic">Mostrador</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {s.pigsSold > 0 ? `${s.pigsSold} und` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{s.totalWeightKg} Kg</td>
                    <td className="px-4 py-3 text-right text-slate-600">${s.pricePerKg.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-950 text-sm">
                      ${s.totalPrice.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                          s.paymentStatus === 'PAGADO'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {s.paymentStatus === 'PAGADO' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Pagado
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Fiado
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {s.paymentStatus === 'FIADO' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Marcar la venta de $${s.totalPrice.toLocaleString('es-CO')} como pagada?`)) {
                                startTransition(async () => {
                                  await markSwineSaleAsPaid(s.id);
                                });
                              }
                            }}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                            title="Cobrar Fiado"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar esta venta? Si se descontaron cerdos volverán al corral.')) {
                              startTransition(async () => {
                                await deleteSwineSale(s.id);
                              });
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Venta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Registrar Venta / Despacho
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Canal de Venta</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChannelChange('EN_PIE')}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      saleType === 'EN_PIE'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-blue-600" />
                    En Pie (Báscula)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChannelChange('CANAL')}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      saleType === 'CANAL'
                        ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-purple-600" />
                    En Canal (Faenado)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChannelChange('TIENDA_DETAL')}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      saleType === 'TIENDA_DETAL'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-amber-600" />
                    Detal en Tienda
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Corral de Salida</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg bg-white font-medium"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} ({b.currentQuantity} cerdos vivos - aprox {b.currentAvgWeight} Kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {saleType === 'TIENDA_DETAL' ? 'Cerdos a descontar' : 'Cerdos Vendidos'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pigsSold}
                    onChange={(e) => setPigsSold(e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    {saleType === 'TIENDA_DETAL' ? 'Usa 0 para venta de cortes en mostrador' : 'Animales que salen del corral'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    {saleType === 'TIENDA_DETAL' ? 'Kilos Despachados' : 'Kilos Báscula'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 98.5"
                    value={totalWeightKg}
                    onChange={(e) => setTotalWeightKg(e.target.value)}
                    required
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Precio por Kilo ($)</label>
                <input
                  type="number"
                  step="100"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  required
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-semibold"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-950">Total Facturado:</span>
                <span className="text-base font-black text-emerald-950">
                  ${Math.round(computedTotal).toLocaleString('es-CO')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Forma de Pago</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white font-semibold"
                  >
                    <option value="PAGADO">Contado (Pagado)</option>
                    <option value="FIADO">Fiado (Pendiente)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cliente / Comprador</label>
                  <input
                    type="text"
                    placeholder="Ej: Carnicería / Mostrador"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej: Perniles, chuletas o cerdo en pie"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> {isPending ? 'Guardando...' : 'Confirmar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}