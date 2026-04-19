import { prisma } from '@/lib/prisma';

/**
 * Recursively get ALL descendant unit IDs from a given parent unit.
 * Example: getDescendantUnitIds(1) returns [2, 3, 5, 8, ...] (all children, grandchildren, etc.)
 */
export async function getDescendantUnitIds(parentId: number): Promise<number[]> {
  const allUnits = await prisma.unit.findMany({
    select: { id: true, parent_unit_id: true }
  });

  const result: number[] = [];
  const queue = [parentId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = allUnits.filter(u => u.parent_unit_id === currentId);
    for (const child of children) {
      result.push(child.id);
      queue.push(child.id);
    }
  }

  return result;
}

/**
 * Get the unit IDs visible to a given unit (self + all descendants).
 * Used for filtering proposals, proker, kas, etc.
 */
export async function getVisibleUnitIds(unitId: number): Promise<number[]> {
  const descendants = await getDescendantUnitIds(unitId);
  return [unitId, ...descendants];
}

/**
 * Build a tree structure from flat unit list for frontend rendering.
 */
export function buildUnitTree(units: any[], parentId: number | null = null): any[] {
  return units
    .filter(u => u.parent_unit_id === parentId)
    .map(u => ({
      ...u,
      children: buildUnitTree(units, u.id)
    }))
    .sort((a, b) => {
      // Groups first, then units
      if (a.tipe === 'GROUP' && b.tipe !== 'GROUP') return -1;
      if (a.tipe !== 'GROUP' && b.tipe === 'GROUP') return 1;
      return a.id - b.id;
    });
}
