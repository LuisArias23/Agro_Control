'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Crear Lote con comederos y bebederos
export async function createPoultryBatch(formData: FormData) {
  try {
    const batchCode = formData.get('batchCode') as string;
    const initialQuantity = parseInt(formData.get('initialQuantity') as string || '0', 10);
    const chickCostTotal = parseFloat(formData.get('chickCostTotal') as string || '0');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    const feedersCount = parseInt(formData.get('feedersCount') as string || '0', 10);
    const drinkersCount = parseInt(formData.get('drinkersCount') as string || '0', 10);

    if (!batchCode || initialQuantity <= 0) return;

    await prisma.poultryBatch.create({
      data: {
        batchCode,
        startDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        freezerQuantity: 0,
        chickCostTotal,
        feedersCount: isNaN(feedersCount) ? 0 : feedersCount,
        drinkersCount: isNaN(drinkersCount) ? 0 : drinkersCount,
        status: 'EN_ENGORDE',
      },
    });

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al crear lote:', error);
  }
}

// Actualizar Lote
export async function updatePoultryBatch(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const batchCode = formData.get('batchCode') as string;
    const initialQuantity = parseInt(formData.get('initialQuantity') as string || '0', 10);
    const chickCostTotal = parseFloat(formData.get('chickCostTotal') as string || '0');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    const feedersCount = parseInt(formData.get('feedersCount') as string || '0', 10);
    const drinkersCount = parseInt(formData.get('drinkersCount') as string || '0', 10);

    if (!id || !batchCode || initialQuantity <= 0) return;

    const currentBatch = await prisma.poultryBatch.findUnique({
      where: { id },
      include: { dailyLogs: true, sales: true },
    });

    if (!currentBatch) return;

    const totalMortality = currentBatch.dailyLogs.reduce((acc, log) => acc + log.mortalityCount, 0);
    const totalSold = currentBatch.sales.reduce((acc, sale) => acc + sale.birdsSold, 0);
    const newCurrentQuantity = Math.max(
      0,
      initialQuantity - totalMortality - totalSold - (currentBatch.freezerQuantity || 0)
    );

    await prisma.poultryBatch.update({
      where: { id },
      data: {
        batchCode,
        startDate,
        initialQuantity,
        currentQuantity: newCurrentQuantity,
        chickCostTotal,
        feedersCount: isNaN(feedersCount) ? 0 : feedersCount,
        drinkersCount: isNaN(drinkersCount) ? 0 : drinkersCount,
      },
    });

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
    revalidatePath('/avicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al actualizar lote:', error);
  }
}

// Beneficiar aves: pasar del Galpón (Vivos) al Congelador (En Canal)
export async function processBirdsToFreezer(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const birdsCount = parseInt(formData.get('birdsCount') as string || '0', 10);
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || birdsCount <= 0) return;

    const batch = await prisma.poultryBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch || batch.currentQuantity < birdsCount) return;

    await prisma.$transaction([
      prisma.poultryBatch.update({
        where: { id: batchId },
        data: {
          currentQuantity: { decrement: birdsCount },
          freezerQuantity: { increment: birdsCount },
        },
      }),
      prisma.poultryDailyLog.create({
        data: {
          batchId,
          mortalityCount: 0,
          feedBrand: 'SIN_ALIMENTO',
          feedKgServed: 0,
          feedCost: 0,
          notes: `❄️ Beneficio a congelador: ${birdsCount} aves${notes.trim() ? ` (${notes.trim()})` : ''}`,
        },
      }),
    ]);

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
  } catch (error) {
    console.error('Error al pasar aves al congelador:', error);
  }
}

// Agregar Registro Diario (Consumo / Bajas)
export async function addDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const mortalityCount = parseInt(formData.get('mortalityCount') as string || '0', 10);
    const feedBrand = (formData.get('feedBrand') as string) || 'ITALCOL_DORADA';
    const feedStage = (formData.get('feedStage') as string) || 'Iniciación';
    const entryMode = (formData.get('entryMode') as string) || 'bultos';

    const bultos = parseFloat(formData.get('bultos') as string || '0');
    const manualKg = parseFloat(formData.get('manualKg') as string || '0');
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
    } else if (entryMode === 'kilos' && manualKg > 0) {
      feedKgServed = manualKg;
      detailText = `${manualKg} Kg ${brandLabel} [${feedStage}]`;
    }

    const userNotes = (formData.get('notes') as string) || '';
    const finalNotes = [userNotes, detailText].filter(Boolean).join(' - ');

    if (mortalityCount <= 0 && feedKgServed <= 0) return;

    await prisma.$transaction([
      prisma.poultryDailyLog.create({
        data: {
          batchId,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedBrand: feedKgServed > 0 ? feedBrand : 'SIN_ALIMENTO',
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          feedCost: isNaN(feedCost) ? 0 : (feedKgServed > 0 ? feedCost : 0),
          notes: finalNotes || (mortalityCount > 0 ? 'Registro de bajas' : null),
        },
      }),
      ...(mortalityCount > 0
        ? [
            prisma.poultryBatch.update({
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

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
  } catch (error) {
    console.error('Error al registrar novedad diaria:', error);
  }
}

// Eliminar Registro Diario y Restaurar Aves
export async function deleteDailyLog(logId: string) {
  try {
    const log = await prisma.poultryDailyLog.findUnique({
      where: { id: logId },
    });

    if (!log) return;

    // Si era un registro de beneficio al congelador, revertimos del congelador al galpón
    const freezerMatch = log.notes?.match(/^❄️ Beneficio a congelador:\s*(\d+)\s*aves/);
    const freezerBirds = freezerMatch ? parseInt(freezerMatch[1], 10) : 0;

    await prisma.$transaction([
      ...(log.mortalityCount > 0
        ? [
            prisma.poultryBatch.update({
              where: { id: log.batchId },
              data: {
                currentQuantity: { increment: log.mortalityCount },
              },
            }),
          ]
        : []),
      ...(freezerBirds > 0
        ? [
            prisma.poultryBatch.update({
              where: { id: log.batchId },
              data: {
                currentQuantity: { increment: freezerBirds },
                freezerQuantity: { decrement: freezerBirds },
              },
            }),
          ]
        : []),
      prisma.poultryDailyLog.delete({
        where: { id: logId },
      }),
    ]);

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
  } catch (error) {
    console.error('Error al eliminar registro diario:', error);
  }
}

// Registrar Saca Parcial o Venta (descuenta de Congelador si es CANAL, o de Galpón si es EN_PIE)
export async function addPoultrySale(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const birdsSold = parseInt(formData.get('birdsSold') as string || '0', 10);
    const saleType = (formData.get('saleType') as string) || 'CANAL';
    const totalWeight = parseFloat(formData.get('totalWeight') as string || '0');
    const totalPrice = parseFloat(formData.get('totalPrice') as string || '0');
    const paymentStatus = (formData.get('paymentStatus') as string) || 'PAGADO';
    const customer = (formData.get('customer') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || birdsSold <= 0) return;

    const batch = await prisma.poultryBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

    // Si vende en canal y hay pollos en congelador, descuenta del congelador;
    // si no alcanza el congelador (venta directa sin pasar por congelador), descuenta la diferencia del galpón.
    let decrementFreezer = 0;
    let decrementLive = 0;

    if (saleType === 'CANAL' && batch.freezerQuantity > 0) {
      decrementFreezer = Math.min(batch.freezerQuantity, birdsSold);
      decrementLive = Math.max(0, birdsSold - decrementFreezer);
    } else {
      decrementLive = birdsSold;
    }

    await prisma.$transaction([
      prisma.poultrySale.create({
        data: {
          batchId,
          birdsSold,
          saleType,
          totalWeight: isNaN(totalWeight) ? 0 : totalWeight,
          totalPrice: isNaN(totalPrice) ? 0 : totalPrice,
          paymentStatus,
          customer: customer || null,
          notes: notes || null,
        },
      }),
      prisma.poultryBatch.update({
        where: { id: batchId },
        data: {
          ...(decrementFreezer > 0 ? { freezerQuantity: { decrement: decrementFreezer } } : {}),
          ...(decrementLive > 0 ? { currentQuantity: { decrement: decrementLive } } : {}),
        },
      }),
    ]);

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
  } catch (error) {
    console.error('Error al registrar saca parcial:', error);
  }
}

// Eliminar Saca y Devolver Aves (al Congelador si fue CANAL, o al Galpón si fue EN_PIE)
export async function deletePoultrySale(saleId: string) {
  try {
    const sale = await prisma.poultrySale.findUnique({
      where: { id: saleId },
    });

    if (!sale) return;

    const returnToFreezer = sale.saleType === 'CANAL';

    await prisma.$transaction([
      prisma.poultryBatch.update({
        where: { id: sale.batchId },
        data: returnToFreezer
          ? { freezerQuantity: { increment: sale.birdsSold } }
          : { currentQuantity: { increment: sale.birdsSold } },
      }),
      prisma.poultrySale.delete({
        where: { id: saleId },
      }),
    ]);

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
  } catch (error) {
    console.error('Error al eliminar venta:', error);
  }
}

// Marcar Fiado como Pagado
export async function markSaleAsPaid(saleId: string) {
  try {
    await prisma.poultrySale.update({
      where: { id: saleId },
      data: { paymentStatus: 'PAGADO' },
    });

    revalidatePath('/avicultura/ventas');
    revalidatePath('/avicultura');
  } catch (error) {
    console.error('Error al actualizar estado de pago:', error);
  }
}

// Liquidar y Cerrar Lote Definitivamente
export async function closePoultryBatch(batchId: string) {
  try {
    await prisma.poultryBatch.update({
      where: { id: batchId },
      data: {
        status: 'LIQUIDADO',
        endDate: new Date(),
      },
    });

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
    revalidatePath('/avicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al liquidar lote:', error);
  }
}

// Reabrir Lote
export async function reopenPoultryBatch(batchId: string) {
  try {
    await prisma.poultryBatch.update({
      where: { id: batchId },
      data: {
        status: 'EN_ENGORDE',
        endDate: null,
      },
    });

    revalidatePath('/avicultura');
    revalidatePath('/avicultura/ventas');
    revalidatePath('/avicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al reabrir lote:', error);
  }
}

// Registrar Muestreo de Peso
export async function addPoultrySampling(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const sampleBirds = parseInt(formData.get('sampleBirds') as string || '10', 10);
    const avgWeightGrams = parseFloat(formData.get('avgWeightGrams') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || avgWeightGrams <= 0) return;

    await prisma.poultrySampling.create({
      data: {
        batchId,
        sampleBirds,
        avgWeightGrams,
        notes: notes || null,
      },
    });

    revalidatePath('/avicultura');
  } catch (error) {
    console.error('Error al registrar muestreo de peso:', error);
  }
}

// Registrar Tratamiento o Medicación
export async function addPoultryTreatment(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const productName = formData.get('productName') as string;
    const treatmentType = (formData.get('treatmentType') as string) || 'VITAMINA';
    const dose = (formData.get('dose') as string) || '';
    const withdrawalDays = parseInt(formData.get('withdrawalDays') as string || '0', 10);
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || !productName) return;

    await prisma.poultryTreatment.create({
      data: {
        batchId,
        productName,
        treatmentType,
        dose: dose || null,
        withdrawalDays: isNaN(withdrawalDays) ? 0 : withdrawalDays,
        notes: notes || null,
      },
    });

    revalidatePath('/avicultura');
  } catch (error) {
    console.error('Error al registrar tratamiento:', error);
  }
}