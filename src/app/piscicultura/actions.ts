'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Crear Lote / Sembrar Estanque
export async function createFishBatch(formData: FormData) {
  try {
    const pondCode = formData.get('pondCode') as string;
    const species = (formData.get('species') as string) || 'TILAPIA_ROJA';
    const initialQuantity = parseInt(formData.get('initialQuantity') as string || '0', 10);
    const seedCostTotal = parseFloat(formData.get('seedCostTotal') as string || '0');
    const initialAvgWeight = parseFloat(formData.get('initialAvgWeight') as string || '1'); // Gramos iniciales
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
        currentAvgWeight: isNaN(initialAvgWeight) ? 1 : initialAvgWeight,
        status: 'ENGORDE',
      },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al registrar estanque:', error);
  }
}

// Registrar Alimentación Diaria y Bajas (Mortalidad)
export async function addFishDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const mortalityCount = parseInt(formData.get('mortalityCount') as string || '0', 10);
    const feedBrand = (formData.get('feedBrand') as string) || 'Italcol Peces';
    const proteinPercentage = parseInt(formData.get('proteinPercentage') as string || '32', 10);

    const bultos = parseFloat(formData.get('bultos') as string || '0');
    const manualKg = parseFloat(formData.get('manualKg') as string || '0');
    const feedCost = parseFloat(formData.get('feedCost') as string || '0');

    let feedKgServed = 0;
    if (bultos > 0) {
      feedKgServed = bultos * 40;
    } else if (manualKg > 0) {
      feedKgServed = manualKg;
    }

    const notes = (formData.get('notes') as string) || '';

    if (!batchId) return;

    await prisma.$transaction([
      prisma.fishDailyLog.create({
        data: {
          batchId,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedBrand: feedKgServed > 0 ? feedBrand : null,
          proteinPercentage: feedKgServed > 0 ? proteinPercentage : null,
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          feedCost: isNaN(feedCost) ? 0 : feedCost,
          notes: notes || null,
        },
      }),
      ...(mortalityCount > 0
        ? [
            prisma.fishBatch.update({
              where: { id: batchId },
              data: {
                currentQuantity: {
                  decrement: mortalityCount,
                },
              },
            }),
          ]
        : []),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al registrar novedad diaria en estanque:', error);
  }
}

// Registrar Muestreo Biométrico (Pesaje)
export async function addFishSampling(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const sampleCount = parseInt(formData.get('sampleCount') as string || '20', 10);
    const avgWeightGrams = parseFloat(formData.get('avgWeightGrams') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || avgWeightGrams <= 0) return;

    const batch = await prisma.fishBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

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
    console.error('Error al registrar muestreo de peces:', error);
  }
}

// Registrar Cosecha / Venta de Pescado
export async function addFishHarvest(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const fishCount = parseInt(formData.get('fishCount') as string || '0', 10);
    const totalKg = parseFloat(formData.get('totalKg') as string || '0');
    const pricePerKg = parseFloat(formData.get('pricePerKg') as string || '0');
    const paymentStatus = (formData.get('paymentStatus') as string) || 'PAGADO';
    const customer = (formData.get('customer') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || totalKg <= 0) return;

    const totalPrice = totalKg * pricePerKg;

    await prisma.$transaction([
      prisma.fishHarvest.create({
        data: {
          batchId,
          fishCount: isNaN(fishCount) ? 0 : fishCount,
          totalKg,
          pricePerKg,
          totalPrice,
          paymentStatus,
          customer: customer || null,
          notes: notes || null,
        },
      }),
      ...(fishCount > 0
        ? [
            prisma.fishBatch.update({
              where: { id: batchId },
              data: {
                currentQuantity: {
                  decrement: fishCount,
                },
              },
            }),
          ]
        : []),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al registrar cosecha:', error);
  }
}

// Eliminar Registro Diario
export async function deleteFishDailyLog(logId: string) {
  try {
    const log = await prisma.fishDailyLog.findUnique({
      where: { id: logId },
    });

    if (!log) return;

    await prisma.$transaction([
      ...(log.mortalityCount > 0
        ? [
            prisma.fishBatch.update({
              where: { id: log.batchId },
              data: {
                currentQuantity: {
                  increment: log.mortalityCount,
                },
              },
            }),
          ]
        : []),
      prisma.fishDailyLog.delete({
        where: { id: logId },
      }),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al eliminar registro diario:', error);
  }
}

// Eliminar Cosecha y Restaurar Peces
export async function deleteFishHarvest(harvestId: string) {
  try {
    const harvest = await prisma.fishHarvest.findUnique({
      where: { id: harvestId },
    });

    if (!harvest) return;

    await prisma.$transaction([
      ...(harvest.fishCount > 0
        ? [
            prisma.fishBatch.update({
              where: { id: harvest.batchId },
              data: {
                currentQuantity: {
                  increment: harvest.fishCount,
                },
              },
            }),
          ]
        : []),
      prisma.fishHarvest.delete({
        where: { id: harvestId },
      }),
    ]);

    revalidatePath('/piscicultura');
  } catch (error) {
    console.error('Error al eliminar cosecha:', error);
  }
}
// Liquidar / Finalizar Estanque (pasa a Historial)
export async function closeFishBatch(batchId: string) {
  try {
    await prisma.fishBatch.update({
      where: { id: batchId },
      data: {
        status: 'LIQUIDADO',
        endDate: new Date(),
      },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al liquidar estanque:', error);
  }
}

// Reactivar Estanque desde Historial
export async function reopenFishBatch(batchId: string) {
  try {
    await prisma.fishBatch.update({
      where: { id: batchId },
      data: {
        status: 'ENGORDE',
        endDate: null,
      },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al reactivar estanque:', error);
  }
}

// Marcar venta/cosecha fiada como cobrada
export async function markFishHarvestAsPaid(harvestId: string) {
  try {
    await prisma.fishHarvest.update({
      where: { id: harvestId },
      data: { paymentStatus: 'PAGADO' },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/ventas');
  } catch (error) {
    console.error('Error al marcar cosecha como pagada:', error);
  }
}
// 1. REGISTRAR SACA / FAENA (Pasa del estanque a Cava/Nevera)
export async function registerFishHarvest(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const fishCount = parseInt(formData.get('fishCount') as string || '0', 10);
    const totalKg = parseFloat(formData.get('totalKg') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || totalKg <= 0) return;

    await prisma.$transaction([
      prisma.fishHarvest.create({
        data: {
          batchId,
          fishCount: isNaN(fishCount) ? 0 : fishCount,
          totalKg,
          notes: notes || null,
        },
      }),
      ...(fishCount > 0
        ? [
            prisma.fishBatch.update({
              where: { id: batchId },
              data: {
                currentQuantity: {
                  decrement: fishCount,
                },
              },
            }),
          ]
        : []),
    ]);

    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/ventas');
  } catch (error) {
    console.error('Error al registrar saca:', error);
  }
}

// 2. REGISTRAR VENTA (Descuenta de lo sacado y suma dinero)
export async function registerFishSale(formData: FormData) {
  try {
    const harvestId = (formData.get('harvestId') as string) || null;
    const saleFormat = (formData.get('saleFormat') as string) || 'DETAL';
    const kgSold = parseFloat(formData.get('kgSold') as string || '0');
    const fishCount = parseInt(formData.get('fishCount') as string || '0', 10);
    const pricePerKg = parseFloat(formData.get('pricePerKg') as string || '0');
    const paymentStatus = (formData.get('paymentStatus') as string) || 'PAGADO';
    const customer = (formData.get('customer') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (kgSold <= 0) return;

    const totalPrice = kgSold * pricePerKg;

    await prisma.fishSale.create({
      data: {
        harvestId: harvestId || undefined,
        saleFormat,
        kgSold,
        fishCount: isNaN(fishCount) ? 0 : fishCount,
        pricePerKg,
        totalPrice,
        paymentStatus,
        customer: customer || (saleFormat === 'DETAL' ? 'Cliente Detal' : 'Mayorista'),
        notes: notes || null,
      },
    });

    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/ventas');
  } catch (error) {
    console.error('Error al registrar venta:', error);
  }
}

// 3. ELIMINAR VENTA DE PESCADO
export async function deleteFishSale(saleId: string) {
  try {
    await prisma.fishSale.delete({
      where: { id: saleId },
    });
    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/ventas');
  } catch (error) {
    console.error('Error al eliminar venta:', error);
  }
}

// 4. MARCAR VENTA FIADA COMO PAGADA
export async function markFishSaleAsPaid(saleId: string) {
  try {
    await prisma.fishSale.update({
      where: { id: saleId },
      data: { paymentStatus: 'PAGADO' },
    });
    revalidatePath('/piscicultura');
    revalidatePath('/piscicultura/ventas');
  } catch (error) {
    console.error('Error al marcar cobro:', error);
  }
}