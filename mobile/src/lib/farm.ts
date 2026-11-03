export type ProductionSystem = 'rainfed' | 'irrigated' | 'mixed';

export const productionSystems: { value: ProductionSystem; label: string; description: string }[] = [
  { value: 'rainfed', label: 'Rainfed', description: 'Relies on rainfall' },
  { value: 'irrigated', label: 'Irrigated', description: 'Uses irrigation' },
  { value: 'mixed', label: 'Both', description: 'Rainfed and irrigated fields' },
];

export function productionSystemLabel(value: ProductionSystem | string | null | undefined) {
  return productionSystems.find((system) => system.value === value)?.label ?? 'Not recorded';
}
