import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const instant = false;

export default async function HomePage() {
  const [activePoultryCount, activeLayersCount, activeFishCount, activeSwineCount] = await Promise.all([
    prisma.poultryBatch.count({ where: { status: 'EN_ENGORDE' } }).catch(() => 0),
    prisma.layerBatch.count({ where: { status: 'EN_POSTURA' } }).catch(() => 0),
    prisma.fishBatch.count({ where: { status: 'ENGORDE' } }).catch(() => 0),
    prisma.swineBatch.count({ where: { status: 'EN_CEBA' } }).catch(() => 0),
  ]);

  const businessModules = [
    {
      title: 'Pollos de Engorde',
      badge: activePoultryCount > 0 
        ? `${activePoultryCount} Lote${activePoultryCount > 1 ? 's' : ''} Activo${activePoultryCount > 1 ? 's' : ''}` 
        : 'Sin lotes activos',
      badgeColor: activePoultryCount > 0 
        ? 'bg-amber-100/90 text-amber-900 border-amber-300' 
        : 'bg-slate-100/90 text-slate-600 border-slate-300',
      description: 'Control de días de ciclo, consumo en bultos/kilos (Italcol/Finca), bajas y costo acumulado.',
      href: '/pollos',
      image: '/modules/pollos.jfif',
    },
    {
      title: 'Gallinas Ponedoras',
      badge: activeLayersCount > 0 
        ? `${activeLayersCount} Lote${activeLayersCount > 1 ? 's' : ''} en Postura` 
        : 'Sin postura activa',
      badgeColor: activeLayersCount > 0 
        ? 'bg-amber-100/90 text-amber-900 border-amber-300' 
        : 'bg-slate-100/90 text-slate-600 border-slate-300',
      description: 'Recolección diaria de huevos comerciales, huevos rotos, % postura y bajas del lote.',
      href: '/ponedoras',
      image: '/modules/ponedoras.jfif',
    },
    {
      title: 'Piscicultura (Peces)',
      badge: activeFishCount > 0 
        ? `${activeFishCount} Estanque${activeFishCount > 1 ? 's' : ''} Activo${activeFishCount > 1 ? 's' : ''}` 
        : 'Estanques inactivos',
      badgeColor: activeFishCount > 0 
        ? 'bg-sky-100/90 text-sky-900 border-sky-300' 
        : 'bg-slate-100/90 text-slate-600 border-slate-300',
      description: 'Estanques de geomembrana, control de biomasa estimada, muestreos de peso en gramos y cosechas.',
      href: '/peces',
      image: '/modules/peces.jfif',
    },
    {
      title: 'Porcicultura (Cerdos)',
      badge: activeSwineCount > 0 
        ? `${activeSwineCount} Lote${activeSwineCount > 1 ? 's' : ''} en Ceba` 
        : 'Sin ceba activa',
      badgeColor: activeSwineCount > 0 
        ? 'bg-rose-100/90 text-rose-900 border-rose-300' 
        : 'bg-slate-100/90 text-slate-600 border-slate-300',
      description: 'Lotes de ceba, control de bultos de concentrado, gastos de flete/veterinaria y ventas en pie/canal.',
      href: '/cerdos',
      image: '/modules/cerdos.jfif',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-sm">
              AC
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">AgroControl</h1>
              <p className="text-[11px] text-slate-500">Gestión Integral Agropecuaria</p>
            </div>
          </div>

          <Link
            href="/inventario"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
          >
            <Package className="w-4 h-4 text-emerald-700" />
            Bodega de Insumos
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Panel de Operaciones</h2>
          <p className="text-sm text-slate-500 mt-1">
            Selecciona la unidad productiva para ingresar registros diarios o consultar balances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessModules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <span
                    className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-sm ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition duration-150">
                    Entrar <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl bg-[#092c1f] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-emerald-950">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-800/80 border border-emerald-700 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Bodega Central de Concentrados e Insumos</h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Control de bultos y kilos por línea (Pollos, Ponedoras, Peces, Cerdos) y alertas de reposición.
              </p>
            </div>
          </div>
          <Link
            href="/inventario"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 shadow-sm"
          >
            Gestionar Insumos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}