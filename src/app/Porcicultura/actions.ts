'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. Registrar Cerda
export async function createSwineSow(formData: FormData) {
  try {
    const code = (formData.get('code') as string)?.trim();
    const breed = (formData.get('breed') as string)?.trim() || 'Landrace x Pietrain';
    const status = (formData.get('status') as string) || 'VACIA';

    if (!code) return;

    await prisma.swineSow.create({
      data: {
        code,
        breed,
        status,
      },
    });

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar cerda:', error);
  }
}

// 2. Registrar Monta (114 días de gestación)
export async function registerMating(formData: FormData) {
  try {
    const sowId = formData.get('sowId') as string;
    const matingDateRaw = formData.get('matingDate') as string;
    const matingDate = matingDateRaw ? new Date(matingDateRaw) : new Date();

    const expectedDate = new Date(matingDate);
    expectedDate.setDate(expectedDate.getDate() + 114);

    if (!sowId) return;

    await prisma.$transaction([
      prisma.swineFarrowing.create({
        data: {
          sowId,
          matingDate,
          expectedDate,
        },
      }),
      prisma.swineSow.update({
        where: { id: sowId },
        data: { status: 'GESTANTE' },
      }),
    ]);

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar monta:', error);
  }
}

// 3. Registrar Parto
export async function registerFarrowing(formData: FormData) {
  try {
    const farrowingId = formData.get('farrowingId') as string;
    const sowId = formData.get('sowId') as string;
    const bornAlive = parseInt((formData.get('bornAlive') as string) || '0', 10);
    const bornDead = parseInt((formData.get('bornDead') as string) || '0', 10);
    const farrowingDateRaw = formData.get('farrowingDate') as string;
    const farrowingDate = farrowingDateRaw ? new Date(farrowingDateRaw) : new Date();

    if (farrowingId) {
      await prisma.$transaction([
        prisma.swineFarrowing.update({
          where: { id: farrowingId },
          data: {
            farrowingDate,
            bornAlive,
            bornDead,
          },
        }),
        prisma.swineSow.update({
          where: { id: sowId },
          data: { status: 'LACTANDO' },
        }),
      ]);
    } else if (sowId) {
      await prisma.$transaction([
        prisma.swineFarrowing.create({
          data: {
            sowId,
            farrowingDate,
            bornAlive,
            bornDead,
          },
        }),
        prisma.swineSow.update({
          where: { id: sowId },
          data: { status: 'LACTANDO' },
        }),
      ]);
    }

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar parto:', error);
  }
}

// 4. Registrar Destete (Pasa la cerda a Vacía y crea el lote en "Lechones Destete")
export async function registerWeaningAndCreateBatch(formData: FormData) {
  try {
    const sowId = formData.get('sowId') as string;
    const farrowingId = formData.get('farrowingId') as string;
    const batchCode = (formData.get('batchCode') as string)?.trim();
    const weanedCount = parseInt((formData.get('weanedCount') as string) || '0', 10);
    const weaningAvgWeight = parseFloat((formData.get('weaningAvgWeight') as string) || '7');
    const initialCostTotal = parseFloat((formData.get('initialCostTotal') as string) || '0');

    if (!sowId || !batchCode || weanedCount <= 0) return;

    await prisma.$transaction([
      ...(farrowingId
        ? [
            prisma.swineFarrowing.update({
              where: { id: farrowingId },
              data: {
                weanedCount,
                weaningAvgWeight,
                weaningDate: new Date(),
              },
            }),
          ]
        : []),
      prisma.swineSow.update({
        where: { id: sowId },
        data: { status: 'VACIA' },
      }),
      prisma.swineBatch.create({
        data: {
          batchCode,
          stage: 'DESTETE_PRECEBO',
          initialQuantity: weanedCount,
          currentQuantity: weanedCount,
          initialAvgWeight: weaningAvgWeight,
          currentAvgWeight: weaningAvgWeight,
          purchaseCostTotal: isNaN(initialCostTotal) ? 0 : initialCostTotal,
          origin: 'GRANJA',
          status: 'ACTIVO',
        },
      }),
    ]);

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar destete:', error);
  }
}

// 5. Promover Lechones de Destete a Ceba
export async function promoteToCeba(batchId: string) {
  try {
    await prisma.swineBatch.update({
      where: { id: batchId },
      data: { stage: 'CEBA_ENGORDE' },
    });
    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al promover a ceba:', error);
  }
}

// 6. Ingresar Lote Directo (Comprado o Inventario Inicial)
export async function createSwineBatch(formData: FormData) {
  try {
    const batchCode = (formData.get('batchCode') as string)?.trim();
    const stage = (formData.get('stage') as any) || 'CEBA_ENGORDE';
    const origin = (formData.get('origin') as string) || 'COMPRA_EXTERNA';
    const initialQuantity = parseInt((formData.get('initialQuantity') as string) || '0', 10);
    const initialAvgWeight = parseFloat((formData.get('initialAvgWeight') as string) || '10');
    const purchaseCostTotal = parseFloat((formData.get('purchaseCostTotal') as string) || '0');
    const startDateRaw = formData.get('startDate') as string;
    const startDate = startDateRaw ? new Date(startDateRaw) : new Date();

    if (!batchCode || initialQuantity <= 0) return;

    await prisma.swineBatch.create({
      data: {
        batchCode,
        stage,
        origin,
        startDate,
        initialQuantity,
        currentQuantity: initialQuantity,
        initialAvgWeight: isNaN(initialAvgWeight) ? 10 : initialAvgWeight,
        currentAvgWeight: isNaN(initialAvgWeight) ? 10 : initialAvgWeight,
        purchaseCostTotal: isNaN(purchaseCostTotal) ? 0 : purchaseCostTotal,
        status: 'ACTIVO',
      },
    });

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al crear lote directo:', error);
  }
}

// 7. Registrar Comida y Bajas
export async function addSwineDailyLog(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const mortalityCount = parseInt((formData.get('mortalityCount') as string) || '0', 10);
    const feedPhase = (formData.get('feedPhase') as string) || 'ENGORDE';

    const bultos = parseFloat((formData.get('bultos') as string) || '0');
    const manualKg = parseFloat((formData.get('manualKg') as string) || '0');
    const feedCost = parseFloat((formData.get('feedCost') as string) || '0');

    let feedKgServed = 0;
    if (bultos > 0) {
      feedKgServed = bultos * 40;
    } else if (manualKg > 0) {
      feedKgServed = manualKg;
    }

    const notes = (formData.get('notes') as string) || '';

    if (!batchId) return;

    await prisma.$transaction([
      prisma.swineDailyLog.create({
        data: {
          batchId,
          mortalityCount: isNaN(mortalityCount) ? 0 : mortalityCount,
          feedPhase,
          feedKgServed: isNaN(feedKgServed) ? 0 : feedKgServed,
          feedCost: isNaN(feedCost) ? 0 : feedCost,
          notes: notes || null,
        },
      }),
      ...(mortalityCount > 0
        ? [
            prisma.swineBatch.update({
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

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar comida:', error);
  }
}

// 8. Registrar Venta (En pie / Canal / Detal Tienda / Lechón)
export async function addSwineSale(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const saleType = (formData.get('saleType') as string) || 'EN_PIE';
    const rawPigsSold = formData.get('pigsSold') as string;
    
    // Si es en tienda al detal por porciones/kilos, puede ser 0 animales completos
    const pigsSold = rawPigsSold !== null && rawPigsSold !== undefined ? parseInt(rawPigsSold, 10) : (saleType === 'TIENDA_DETAL' ? 0 : 1);
    
    const totalWeightKg = parseFloat((formData.get('totalWeightKg') as string) || '0');
    const pricePerKg = parseFloat((formData.get('pricePerKg') as string) || '0');
    const paymentStatus = (formData.get('paymentStatus') as string) || 'PAGADO';
    const customer = (formData.get('customer') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || totalWeightKg <= 0) return;

    const totalPrice = totalWeightKg * pricePerKg;

    await prisma.$transaction([
      prisma.swineSale.create({
        data: {
          batchId,
          pigsSold: isNaN(pigsSold) ? 0 : pigsSold,
          totalWeightKg,
          pricePerKg,
          totalPrice,
          saleType,
          paymentStatus,
          customer: customer || null,
          notes: notes || null,
        },
      }),
      ...(pigsSold > 0
        ? [
            prisma.swineBatch.update({
              where: { id: batchId },
              data: {
                currentQuantity: {
                  decrement: pigsSold,
                },
              },
            }),
          ]
        : []),
    ]);

    revalidatePath('/Porcicultura');
    revalidatePath('/Porcicultura/ventas');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al registrar venta:', error);
  }
}

// 9. Cobrar Fiado
export async function markSwineSaleAsPaid(saleId: string) {
  try {
    await prisma.swineSale.update({
      where: { id: saleId },
      data: { paymentStatus: 'PAGADO' },
    });
    revalidatePath('/Porcicultura/ventas');
    revalidatePath('/Porcicultura');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al cobrar fiado:', error);
  }
}

// 10. Eliminar Venta y restaurar cerdos al corral si aplica
export async function deleteSwineSale(saleId: string) {
  try {
    const sale = await prisma.swineSale.findUnique({
      where: { id: saleId },
    });

    if (!sale) return;

    await prisma.$transaction([
      ...(sale.pigsSold > 0
        ? [
            prisma.swineBatch.update({
              where: { id: sale.batchId },
              data: {
                currentQuantity: {
                  increment: sale.pigsSold,
                },
              },
            }),
          ]
        : []),
      prisma.swineSale.delete({
        where: { id: saleId },
      }),
    ]);

    revalidatePath('/Porcicultura');
    revalidatePath('/Porcicultura/ventas');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al eliminar venta:', error);
  }
}

// 11. Liquidar Lote
export async function closeSwineBatch(batchId: string) {
  try {
    await prisma.swineBatch.update({
      where: { id: batchId },
      data: {
        status: 'LIQUIDADO',
        endDate: new Date(),
      },
    });

    revalidatePath('/Porcicultura');
    revalidatePath('/Porcicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al liquidar lote:', error);
  }
}

// 12. Reactivar Lote
export async function reopenSwineBatch(batchId: string) {
  try {
    await prisma.swineBatch.update({
      where: { id: batchId },
      data: {
        status: 'ACTIVO',
        endDate: null,
      },
    });

    revalidatePath('/Porcicultura');
    revalidatePath('/Porcicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al reactivar lote:', error);
  }
}

// 13. Registrar Pesaje / Biometría
export async function addSwineSampling(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const sampleCount = parseInt((formData.get('sampleCount') as string) || '5', 10);
    const avgWeightKg = parseFloat((formData.get('avgWeightKg') as string) || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!batchId || avgWeightKg <= 0) return;

    await prisma.$transaction([
      prisma.swineSampling.create({
        data: {
          batchId,
          sampleCount,
          avgWeightKg,
          notes: notes || null,
        },
      }),
      prisma.swineBatch.update({
        where: { id: batchId },
        data: {
          currentAvgWeight: avgWeightKg,
        },
      }),
    ]);

    revalidatePath('/Porcicultura');
  } catch (error) {
    console.error('Error al registrar pesaje en porcicultura:', error);
  }
}

// 14. Actualizar datos de lote (nombre, cerdos vivos, peso y costo inicial)
export async function updateSwineBatch(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const batchCode = (formData.get('batchCode') as string)?.trim();
    const currentQuantity = parseInt((formData.get('currentQuantity') as string) || '0', 10);
    const currentAvgWeight = parseFloat((formData.get('currentAvgWeight') as string) || '0');
    const purchaseCostTotal = parseFloat((formData.get('purchaseCostTotal') as string) || '0');

    if (!batchId || !batchCode) return;

    await prisma.swineBatch.update({
      where: { id: batchId },
      data: {
        batchCode,
        currentQuantity: isNaN(currentQuantity) ? 0 : currentQuantity,
        currentAvgWeight: isNaN(currentAvgWeight) ? 0 : currentAvgWeight,
        purchaseCostTotal: isNaN(purchaseCostTotal) ? 0 : purchaseCostTotal,
      },
    });

    revalidatePath('/Porcicultura');
    revalidatePath('/Porcicultura/historial');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al editar lote de porcicultura:', error);
  }
}