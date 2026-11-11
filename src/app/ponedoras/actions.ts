'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Registrar Lote de Gallinas Ponedoras
export async function createLayerBatch(formData: FormData) {
  try {
    const batchCode = formData.get('batchCode') as string;
    const initialHens = parseInt(formData.get('initialHens') as string || '0', 10);
    const costTotal = parseFloat(formData.get('costTotal') as string || '0');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    if (!batchCode || initialHens <= 0) return;

    await prisma.layerBatch.create({
      data: {
        batchCode,
        startDate,
        initialHens,
        currentHens: initialHens,
        costTotal: isNaN(costTotal) ? 0 : costTotal,
        status: 'EN_POSTURA',
      },
    });

    revalidatePath('/ponedoras');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al registrar lote de ponedoras:', error);
  }
}

// Registrar Recolección Diaria, Bajas y Alimento
export async function addLayerDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const eggsCollected = parseInt(formData.get('eggsCollected') as string || '0', 10);
    const eggsBroken = parseInt(formData.get('eggsBroken') as string || '0', 10);
    const mortalityCount = parseInt(formData.get('mortalityCount') as string || '0', 10);

    const bultos = parseFloat(formData.get('bultos') as string || '0');
    const manualKg = parseFloat(formData.get('manualKg') as string || '0');

    let feedKgServed = 0;
    if (bultos > 0) {
      feedKgServed = bultos * 40;
    } else if (manualKg > 0) {
      feedKgServed = manualKg;
    }

    const notes = (formData.get('notes') as string) || '';

    if (!batchId) return;

    await prisma.$transaction([
      prisma.layerDailyLog.create({
        data: {
          batchId,
          eggsCollected: isNaN(eggsCollected) ? 0 : eggsCollected,
          eggsBroken: isNaN(eggsBroken) ? 0 : eggsBroken,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          notes: notes || null,
        },
      }),
      ...(mortalityCount > 0
        ? [
            prisma.layerBatch.update({
              where: { id: batchId },
              data: {
                currentHens: {
                  decrement: mortalityCount,
                },
              },
            }),
          ]
        : []),
    ]);

    revalidatePath('/ponedoras');
  } catch (error) {
    console.error('Error al registrar recolección:', error);
  }
}
// Eliminar Registro Diario de Postura y Restaurar Gallinas si hubo bajas
export async function deleteLayerDailyLog(logId: string) {
  try {
    const log = await prisma.layerDailyLog.findUnique({
      where: { id: logId },
    });

    if (!log) return;

    await prisma.$transaction([
      ...(log.mortalityCount > 0
        ? [
            prisma.layerBatch.update({
              where: { id: log.batchId },
              data: {
                currentHens: {
                  increment: log.mortalityCount,
                },
              },
            }),
          ]
        : []),
      prisma.layerDailyLog.delete({
        where: { id: logId },
      }),
    ]);

    revalidatePath('/ponedoras');
  } catch (error) {
    console.error('Error al eliminar registro de postura:', error);
  }
}