export const instant = false;

import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { getInventorySummary } from './actions';
import { InventoryView } from './InventoryView';

export default async function InventarioPage() {
  const { supplies, inUse } = await getInventorySummary();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                Bodega Central de Insumos y Equipos
              </h1>
              <p className="text-xs text-slate-500">
                Control multinegocio: Pollos, Ponedoras, Peces y Cerdos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <InventoryView supplies={supplies} poultryInUse={inUse.pollos} />
      </main>
    </div>
  );
}