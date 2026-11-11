'use client';

import { useState, useTransition } from 'react';
import { Scale, ShieldAlert, X, Check, Sparkles } from 'lucide-react';
import { addPoultrySampling, addPoultryTreatment } from './actions';

// Catálogo técnico de tratamientos frecuentes para pollo de engorde
const SANITARY_PRESETS = [
  {
    label: '⚡ Electrolitos / Antiestrés Térmico (Golpe de calor)',
    name: 'Electrolitos + Complejo B',
    type: 'VITAMINA',
    dose: '1 g por litro de agua (o 5 g por bebedero de 5L)',
    withdrawal: 0,
    notes: 'Suministrar en las horas más frescas (mañana) durante días de alta temperatura.',
  },
  {
    label: '💊 Enrofloxacina 10% (Ronquera / Respiratorio)',
    name: 'Enrofloxacina 10%',
    type: 'ANTIBIOTICO',
    dose: '1 ml por litro de agua (5 ml en bebedero de 5L) por 3 a 5 días',
    withdrawal: 7,
    notes: 'Aplicar con sed matutina. Retiro obligatorio de 7 días antes del beneficio.',
  },
  {
    label: '💨 Novabroncol + Enrofloxacina (Expectorante + Antibiótico)',
    name: 'Novabroncol + Enrofloxacina 10%',
    type: 'ANTIBIOTICO',
    dose: '1 ml Novabroncol + 1 ml Enrofloxacina por litro de agua (5 días)',
    withdrawal: 7,
    notes: 'Coadyuvante mucolítico y antibacteriano para afecciones respiratorias severas.',
  },
  {
    label: '🛡️ Vacuna Gumboro (Intermedia)',
    name: 'Vacuna Gumboro cepa intermedia',
    type: 'VACUNA',
    dose: 'Vía ocular o agua de bebida con leche descremada (Día 10 a 14)',
    withdrawal: 0,
    notes: 'Uso de agua libre de cloro y temperatura fresca.',
  },
  {
    label: '🛡️ Vacuna Newcastle + Bronquitis (B1 / La Sota)',
    name: 'Vacuna Newcastle + Bronquitis',
    type: 'VACUNA',
    dose: 'Gota ocular / nasal o agua de bebida (Día 8 a 10)',
    withdrawal: 0,
    notes: 'Revisar cadena de frío.',
  },
  {
    label: '🪱 Desparasitante Oral (Levamisol / Piperazina)',
    name: 'Levamisol oral',
    type: 'DESPARASITANTE',
    dose: '1 ml por cada 2 litros de agua (dosis única)',
    withdrawal: 3,
    notes: 'Retirar alimento 2 horas antes de suministrar el agua medicada.',
  },
];

export function PoultryAdvancedModals({ batchId, batchCode }: { batchId: string; batchCode: string }) {
  const [openModal, setOpenModal] = useState<'sampling' | 'treatment' | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados controlados para autocompletar el plan sanitario
  const [productName, setProductName] = useState('');
  const [treatmentType, setTreatmentType] = useState('VITAMINA');
  const [dose, setDose] = useState('1g / litro agua');
  const [withdrawalDays, setWithdrawalDays] = useState('0');
  const [notes, setNotes] = useState('');

  const handlePresetSelect = (presetIndex: number) => {
    if (presetIndex < 0) return;
    const preset = SANITARY_PRESETS[presetIndex];
    setProductName(preset.name);
    setTreatmentType(preset.type);
    setDose(preset.dose);
    setWithdrawalDays(preset.withdrawal.toString());
    setNotes(preset.notes);
  };

  const handleSamplingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('batchId', batchId);

    startTransition(async () => {
      await addPoultrySampling(formData);
      setOpenModal(null);
    });
  };

  const handleTreatmentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('batchId', batchId);
    formData.append('productName', productName);
    formData.append('treatmentType', treatmentType);
    formData.append('dose', dose);
    formData.append('withdrawalDays', withdrawalDays);
    formData.append('notes', notes);

    startTransition(async () => {
      await addPoultryTreatment(formData);
      setProductName('');
      setNotes('');
      setOpenModal(null);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpenModal('sampling')}
        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg transition cursor-pointer"
      >
        <Scale className="w-3.5 h-3.5 text-indigo-600" />
        Muestreo Peso
      </button>

      <button
        type="button"
        onClick={() => setOpenModal('treatment')}
        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg transition cursor-pointer"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
        Sanidad / Vacuna
      </button>

      {/* Modal Muestreo Peso */}
      {openModal === 'sampling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" /> Pesaje: {batchCode}
              </h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSamplingSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Peso Promedio por Pollo (Gramos)</label>
                <input
                  type="number"
                  step="1"
                  name="avgWeightGrams"
                  placeholder="Ej: 1850"
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-indigo-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pollos Pesados</label>
                  <input
                    type="number"
                    name="sampleBirds"
                    defaultValue="10"
                    min="1"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Notas</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Semana 4"
                    className="w-full text-xs px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setOpenModal(null)} className="px-3 py-1.5 text-xs text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> {isPending ? 'Guardando...' : 'Guardar Pesaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plan Sanitario con Asistente de Dosis */}
      {openModal === 'treatment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" /> Plan Sanitario: {batchCode}
              </h3>
              <button onClick={() => setOpenModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Asistente Rápido de Dosis */}
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
              <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Dosis Recomendadas Frecuentes
              </label>
              <select
                onChange={(e) => handlePresetSelect(Number(e.target.value))}
                defaultValue=""
                className="w-full text-xs px-2 py-1.5 border border-emerald-300 rounded-lg bg-white text-slate-800 font-medium cursor-pointer"
              >
                <option value="" disabled>Selecciona un tratamiento para autocompletar...</option>
                {SANITARY_PRESETS.map((p, idx) => (
                  <option key={p.name} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleTreatmentSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Producto / Vacuna</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Complejo B + Electrolitos"
                  required
                  className="w-full text-xs px-3 py-2 border rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tipo</label>
                  <select
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value)}
                    className="w-full text-xs px-2 py-2 border rounded-lg bg-white font-medium"
                  >
                    <option value="VITAMINA">Vitamina / Electrolito</option>
                    <option value="VACUNA">Vacuna</option>
                    <option value="ANTIBIOTICO">Antibiótico</option>
                    <option value="DESPARASITANTE">Desparasitante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dosis Sugerida</label>
                  <input
                    type="text"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="1g / litro agua"
                    className="w-full text-xs px-2.5 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Días de Retiro (Carne)</label>
                <input
                  type="number"
                  value={withdrawalDays}
                  onChange={(e) => setWithdrawalDays(e.target.value)}
                  min="0"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg font-bold text-rose-700 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tiempo mínimo antes del sacrificio para evitar trazas residuales de medicamento.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Observaciones de Aplicación</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Aplicar en la mañana con sed previa"
                  className="w-full text-xs px-2.5 py-1.5 border rounded-lg text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setOpenModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? 'Guardando...' : 'Guardar Tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}