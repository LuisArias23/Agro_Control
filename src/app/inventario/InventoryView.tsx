'use client';

import { useState, useTransition } from 'react';
import { Package, PlusCircle, ArrowDownCircle, AlertTriangle, UtensilsCrossed, Droplet, Check, Layers } from 'lucide-react';
import { createFarmSupply, addSupplyMovement } from './actions';

interface SupplyMovement {
  id: string;
  type: string;
  quantity: any;
  unitCost: any;
  totalCost: any;
  createdAt: Date;
  notes: string | null;
}

interface SupplyItem {
  id: string;
  business: 'POLLOS' | 'PONEDORAS' | 'PECES' | 'CERDOS';
  name: string;
  type: 'CONCENTRADO' | 'MEDICAMENTO' | 'INSUMO_GENERAL' | 'EQUIPO';
  unit: string;
  currentStock: any;
  avgCostPerUnit: any;
  minAlertStock: any;
  movements: SupplyMovement[];
}

interface InventoryViewProps {
  supplies: SupplyItem[];
  poultryInUse: {
    feeders: number;
    drinkers: number;
  };
}

export function InventoryView({ supplies, poultryInUse }: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<'TODAS' | 'POLLOS' | 'PONEDORAS' | 'PECES' | 'CERDOS'>('TODAS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplyForMovement, setSelectedSupplyForMovement] = useState<SupplyItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredSupplies = activeTab === 'TODAS'
    ? supplies
    : supplies.filter((s) => s.business === activeTab);

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createFarmSupply(formData);
      setShowCreateModal(false);
    });
  };

  const handleMovementSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!selectedSupplyForMovement) return;
    formData.append('supplyId', selectedSupplyForMovement.id);

    startTransition(async () => {
      await addSupplyMovement(formData);
      setSelectedSupplyForMovement(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Equipos en Galpón */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Comederos en Galpón</p>
            <p className="text-lg font-bold text-slate-900">{poultryInUse.feeders} Unds</p>
            <span className="text-[10px] text-amber-700 font-semibold">En uso activo (Pollos)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bebederos en Galpón</p>
            <p className="text-lg font-bold text-slate-900">{poultryInUse.drinkers} Unds</p>
            <span className="text-[10px] text-sky-700 font-semibold">En uso activo (Pollos)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Ítems en Bodega</p>
            <p className="text-lg font-bold text-slate-900">{supplies.length}</p>
            <span className="text-[10px] text-slate-500">Insumos y equipos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Gestión de Stock</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">Nuevo Registro</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Ítem
          </button>
        </div>
      </div>

      {/* Pestañas de Filtrado por Negocio */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {(['TODAS', 'POLLOS', 'PONEDORAS', 'PECES', 'CERDOS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'TODAS' ? 'Todas las Líneas' : tab}
          </button>
        ))}
      </div>

      {/* Tabla de Insumos y Equipos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredSupplies.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No hay insumos o equipos registrados para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Línea</th>
                  <th className="py-3 px-4">Insumo / Implemento</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Stock en Bodega</th>
                  <th className="py-3 px-4">Costo Promedio</th>
                  <th className="py-3 px-4">Alertas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSupplies.map((item) => {
                  const stock = Number(item.currentStock);
                  const minAlert = Number(item.minAlertStock);
                  const isLow = stock <= minAlert;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200">
                          {item.business}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'EQUIPO'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : item.type === 'CONCENTRADO'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {stock} <span className="font-normal text-slate-500 text-[11px]">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        ${Number(item.avgCostPerUnit).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Reponer (&lt; {minAlert})
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-700">Óptimo</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSupplyForMovement(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition cursor-pointer"
                        >
                          + Entrada / Ajuste
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

      {/* Modal: Crear Insumo o Equipo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Registrar Insumo o Equipo en Bodega</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Línea Productiva</label>
                <select name="business" defaultValue={activeTab === 'TODAS' ? 'POLLOS' : activeTab} className="w-full text-xs px-3 py-2 border rounded-lg bg-white">
                  <option value="POLLOS">Pollos de Engorde</option>
                  <option value="PONEDORAS">Gallinas Ponedoras</option>
                  <option value="PECES">Piscicultura (Peces)</option>
                  <option value="CERDOS">Porcicultura (Cerdos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Ítem</label>
                <input type="text" name="name" placeholder="Ej: Comederos Tolva 12Kg, Italcol Dorada" required className="w-full text-xs px-3 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo</label>
                  <select name="type" className="w-full text-xs px-3 py-2 border rounded-lg bg-white">
                    <option value="CONCENTRADO">Concentrado / Alimento</option>
                    <option value="EQUIPO">Equipo / Activo Fijo</option>
                    <option value="MEDICAMENTO">Medicamento / Vacuna</option>
                    <option value="INSUMO_GENERAL">Insumo General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unidad de Medida</label>
                  <select name="unit" className="w-full text-xs px-3 py-2 border rounded-lg bg-white">
                    <option value="UND">UND (Unidades)</option>
                    <option value="KG">KG (Kilos)</option>
                    <option value="BULTO">BULTO (40 Kg)</option>
                    <option value="LITRO">LITRO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Stock Inicial</label>
                  <input type="number" step="0.1" name="currentStock" placeholder="0" defaultValue="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Costo Unit ($)</label>
                  <input type="number" step="0.01" name="avgCostPerUnit" placeholder="0" defaultValue="0" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Alerta Mínima</label>
                  <input type="number" step="0.1" name="minAlertStock" placeholder="10" defaultValue="5" className="w-full text-xs px-2.5 py-1.5 border rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Guardando...' : 'Guardar Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Entrada o Ajuste */}
      {selectedSupplyForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Movimiento de Stock: {selectedSupplyForMovement.name}
            </h3>
            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Movimiento</label>
                <select name="movementType" className="w-full text-xs px-3 py-2 border rounded-lg bg-white">
                  <option value="ENTRADA_COMPRA">Entrada por Compra (+)</option>
                  <option value="SALIDA_CONSUMO">Salida o Ajuste (-)</option>
                  <option value="AJUSTE">Ajuste de Inventario</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cantidad ({selectedSupplyForMovement.unit})
                  </label>
                  <input type="number" step="0.1" name="quantity" placeholder="0" min="0.1" required className="w-full text-xs px-3 py-2 border rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Costo Unitario ($)</label>
                  <input type="number" step="0.01" name="unitCost" defaultValue={Number(selectedSupplyForMovement.avgCostPerUnit)} placeholder="0" className="w-full text-xs px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observación o Factura</label>
                <input type="text" name="notes" placeholder="Ej: Factura Agroinsumos, compra bultos" className="w-full text-xs px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedSupplyForMovement(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Procesando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}