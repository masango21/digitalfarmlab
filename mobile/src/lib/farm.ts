export type ProductionSystem = 'rainfed' | 'irrigated' | 'mixed';
export type FarmType = 'smallholder' | 'commercial' | 'subsistence' | 'research' | 'educational' | 'mixed';

export const southAfricanRegions = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

export const farmTypes: { value: FarmType; label: string }[] = [
  { value: 'smallholder', label: 'Smallholder' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'subsistence', label: 'Subsistence' },
  { value: 'research', label: 'Research' },
  { value: 'educational', label: 'Educational' },
  { value: 'mixed', label: 'Mixed' },
];

export const mainCropOptions = [
  'Maize',
  'Wheat',
  'Rice',
  'Sorghum',
  'Millet',
  'Dry beans',
  'Soybeans',
  'Groundnuts',
  'Potatoes',
  'Sweet potatoes',
  'Tomatoes',
  'Cabbage',
  'Spinach',
  'Onions',
  'Citrus',
  'Grapes',
] as const;

export const productionSystems: { value: ProductionSystem; label: string; description: string }[] = [
  { value: 'rainfed', label: 'Rainfed', description: 'Relies on rainfall' },
  { value: 'irrigated', label: 'Irrigated', description: 'Uses irrigation' },
  { value: 'mixed', label: 'Both', description: 'Rainfed and irrigated fields' },
];

export function productionSystemLabel(value: ProductionSystem | string | null | undefined) {
  return productionSystems.find((system) => system.value === value)?.label ?? 'Not recorded';
}

export function farmTypeLabel(value: FarmType | string | null | undefined) {
  return farmTypes.find((type) => type.value === value)?.label ?? 'Not recorded';
}
