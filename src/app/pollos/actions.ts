'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPoultryBatch(formData: FormData) {
  try {
    const batchCode = formData.get('batchCode') as string;
    const initialQuantity = parseInt(formData.get('initialQuantity') as string || '0', 10);
    const chickCostTotal = parseFloat(formData.get('chickCostTotal') as string || '0');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    if (!batchCode || initialQuantity <= 0) return;

    await prisma.poultryBatch.create({
      data: {
        batchCode,
        startDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        chickCostTotal,
        status: 'EN_ENGORDE',
      },
    });

    revalidatePath('/pollos');
  } catch (error) {
    console.error('Error al crear lote:', error);
  }
}

export async function addDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const mortalityCount = parseInt(formData.get('mortalityCount') as string || '0', 10);
    const feedBrand = (formData.get('feedBrand') as string) || 'ITALCOL_DORADA';
    const feedStage = (formData.get('feedStage') as string) || 'Iniciación';
    const entryMode = (formData.get('entryMode') as string) || 'bultos';

    const bultos = parseFloat(formData.get('bultos') as string || '0');
    const manualKg = parseFloat(formData.get('manualKg') as string || '0');
    // Toma el valor neto directo en plata que costó lo que se sirvió
    const feedCost = parseFloat(formData.get('feedCost') as string || '0');

    let feedKgServed = 0;
    let detailText = '';

    const brandNames: Record<string, string> = {
      ITALCOL_DORADA: 'Italcol Dorada',
      ITALCOL_AMARILLA: 'Italcol Amarilla',
      FINCA: 'Finca',
    };

    const brandLabel = brandNames[feedBrand] || feedBrand;

    if (entryMode === 'bultos' && bultos > 0) {
      feedKgServed = bultos * 40;
      detailText = `${bultos} bto(s) ${brandLabel} [${feedStage}]`;
    } else if (manualKg > 0) {
      feedKgServed = manualKg;
      detailText = `${manualKg} Kg ${brandLabel} [${feedStage}]`;
    }

    const userNotes = (formData.get('notes') as string) || '';
    const finalNotes = [userNotes, detailText].filter(Boolean).join(' - ');

    await prisma.$transaction([
      prisma.poultryDailyLog.create({
        data: {
          batchId,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedBrand,
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          feedCost: isNaN(feedCost) ? 0 : feedCost,
          notes: finalNotes || null,
        },
      }),
      prisma.poultryBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: {
            decrement: isNaN(mortalityCount) ? 0 : mortalityCount,
          },
        },
      }),
    ]);

    revalidatePath('/pollos');
  } catch (error) {
    console.error('Error al registrar novedad diaria:', error);
  }
}