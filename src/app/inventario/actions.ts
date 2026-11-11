'use server';

import { prisma } from '@/lib/prisma';
import { BusinessUnit, SupplyType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Obtener inventario general con filtro opcional por línea productiva
export async function getInventorySummary(businessFilter?: BusinessUnit) {
  try {
    const supplies = await prisma.farmSupply.findMany({
      where: businessFilter ? { business: businessFilter } : undefined,
      orderBy: [{ business: 'asc' }, { type: 'asc' }, { name: 'asc' }],
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Conteo en tiempo real de equipos asignados en galpón (Pollos)
    const activePoultryBatches = await prisma.poultryBatch.findMany({
      where: { status: 'EN_ENGORDE' },
      select: { feedersCount: true, drinkersCount: true },
    });

    const poultryInUse = {
      feeders: activePoultryBatches.reduce((acc, b) => acc + (b.feedersCount || 0), 0),
      drinkers: activePoultryBatches.reduce((acc, b) => acc + (b.drinkersCount || 0), 0),
    };

    return {
      supplies,
      inUse: {
        pollos: poultryInUse,
      },
    };
  } catch (error) {
    console.error('Error al consultar inventario central:', error);
    return { supplies: [], inUse: { pollos: { feeders: 0, drinkers: 0 } } };
  }
}

// Crear nuevo ítem en la Bodega Central
export async function createFarmSupply(formData: FormData) {
  try {
    const business = formData.get('business') as BusinessUnit;
    const name = formData.get('name') as string;
    const type = (formData.get('type') as SupplyType) || 'CONCENTRADO';
    const unit = (formData.get('unit') as string) || 'KG';
    const currentStock = parseFloat(formData.get('currentStock') as string || '0');
    const avgCostPerUnit = parseFloat(formData.get('avgCostPerUnit') as string || '0');
    const minAlertStock = parseFloat(formData.get('minAlertStock') as string || '10');

    if (!name || !business) return;

    await prisma.farmSupply.create({
      data: {
        business,
        name,
        type,
        unit,
        currentStock: isNaN(currentStock) ? 0 : currentStock,
        avgCostPerUnit: isNaN(avgCostPerUnit) ? 0 : avgCostPerUnit,
        minAlertStock: isNaN(minAlertStock) ? 10 : minAlertStock,
      },
    });

    revalidatePath('/inventario');
    revalidatePath('/');
  } catch (error) {
    console.error('Error al registrar insumo/equipo:', error);
  }
}

// Registrar entrada (compra) o ajuste de stock
export async function addSupplyMovement(formData: FormData) {
  try {
    const supplyId = formData.get('supplyId') as string;
    const type = (formData.get('movementType') as string) || 'ENTRADA_COMPRA';
    const quantity = parseFloat(formData.get('quantity') as string || '0');
    const unitCost = parseFloat(formData.get('unitCost') as string || '0');
    const notes = (formData.get('notes') as string) || '';

    if (!supplyId || quantity <= 0) return;

    const totalCost = quantity * unitCost;

    await prisma.$transaction([
      prisma.farmSupplyMovement.create({
        data: {
          supplyId,
          type,
          quantity,
          unitCost,
          totalCost,
          notes: notes || null,
        },
      }),
      prisma.farmSupply.update({
        where: { id: supplyId },
        data: {
          currentStock: type === 'SALIDA_CONSUMO' 
            ? { decrement: quantity } 
            : { increment: quantity },
          ...(unitCost > 0 ? { avgCostPerUnit: unitCost } : {}),
        },
      }),
    ]);

    revalidatePath('/inventario');
  } catch (error) {
    console.error('Error al mover stock en bodega:', error);
  }
}