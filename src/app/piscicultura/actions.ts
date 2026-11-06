'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Crear Siembra de Estanque
export async function createFishBatch(formData: FormData) {
  try {
    const pondCode = formData.get('pondCode') as string;
    const species = (formData.get('species') as string) || 'TILAPIA_ROJA';
    const initialQuantity = parseInt(formData.get('initialQuantity') as string || '0', 10);
    const seedCostTotal = parseFloat(formData.get('seedCostTotal') as string || '0');
    const initialAvgWeight = parseFloat(formData.get('initialAvgWeight') as string || '5');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    if (!pondCode || initialQuantity <= 0) return;

    await prisma.fishBatch.create({
      data: {
        pondCode,
        species,
        startDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        seedCostTotal: isNaN(seedCostTotal) ? 0 : seedCostTotal,
        currentAvgWeight: isNaN(initialAvgWeight) ? 5 : initialAvgWeight,
        status: 'ENGORDE',
      },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al sembrar estanque:', error);
  }
}

// Registrar Alimentación y Bajas del Día
export async function addFishDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const mortalityCount = parseInt(formData.get('mortalityCount') as string || '0', 10);
    const feedBrand = (formData.get('feedBrand') as string) || 'Italcol';
    const proteinPercentage = parseInt(formData.get('proteinPercentage') as string || '38', 10);
    const feedKgServed = parseFloat(formData.get('feedKgServed') as string || '0');
    const feedCost = parseFloat(formData.get('feedCost') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId) return;

    await prisma.$transaction([
      prisma.fishDailyLog.create({
        data: {
          batchId,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedBrand,
          proteinPercentage: isNaN(proteinPercentage) ? 38 : proteinPercentage,
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          feedCost: isNaN(feedCost) ? 0 : feedCost,
          notes: notes || null,
        },
      }),
      prisma.fishBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: {
            decrement: isNaN(mortalityCount) ? 0 : mortalityCount,
          },
        },
      }),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al registrar alimentación en estanque:', error);
  }
}

// Registrar Muestreo de Peso (Biometría)
export async function addFishSampling(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const sampleCount = parseInt(formData.get('sampleCount') as string || '20', 10);
    const avgWeightGrams = parseFloat(formData.get('avgWeightGrams') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || avgWeightGrams <= 0) return;

    const batch = await prisma.fishBatch.findUnique({ where: { id: batchId } });
    if (!batch) return;

    // Biomasa = (población viva * gramos) / 1000
    const estimatedBiomass = (batch.currentQuantity * avgWeightGrams) / 1000;

    await prisma.$transaction([
      prisma.fishSampling.create({
        data: {
          batchId,
          sampleCount,
          avgWeightGrams,
          estimatedBiomass,
          notes: notes || null,
        },
      }),
      prisma.fishBatch.update({
        where: { id: batchId },
        data: {
          currentAvgWeight: avgWeightGrams,
        },
      }),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al registrar muestreo:', error);
  }
}