const PRODUCTION_SYSTEMS = new Set(['rainfed', 'irrigated', 'mixed']);

function validateFarmInput(input, partial = false) {
  if ((!partial || input.name !== undefined)
      && (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120)) {
    return 'Farm name is required and must be 120 characters or fewer';
  }
  if (input.areaHectares !== undefined) {
    const area = parseArea(input.areaHectares);
    if (!Number.isFinite(area) || area < 0) return 'Area must be a non-negative number';
  } else if (!partial) {
    return 'Area must be a non-negative number';
  }
  if (input.location !== undefined && input.location !== null
      && (typeof input.location !== 'string' || input.location.length > 200)) {
    return 'Location must be 200 characters or fewer';
  }
  if (input.productionSystem !== undefined && !PRODUCTION_SYSTEMS.has(input.productionSystem)) {
    return 'Production system must be rainfed, irrigated, or mixed';
  }
  return validateCoordinates(input.latitude, input.longitude);
}

function validateFieldInput(input, partial = false) {
  if ((!partial || input.name !== undefined)
      && (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120)) {
    return 'Field name is required and must be 120 characters or fewer';
  }
  if (input.areaHectares !== undefined) {
    const area = parseArea(input.areaHectares);
    if (!Number.isFinite(area) || area < 0) return 'Area must be a non-negative number';
  } else if (!partial) {
    return 'Area must be a non-negative number';
  }
  if (input.soilType !== undefined && input.soilType !== null
      && (typeof input.soilType !== 'string' || input.soilType.length > 100)) {
    return 'Soil type must be 100 characters or fewer';
  }
  if (partial && !['name', 'areaHectares', 'soilType', 'latitude', 'longitude'].some((key) => input[key] !== undefined)) {
    return 'At least one field value is required';
  }
  return validateCoordinates(input.latitude, input.longitude);
}

function parseArea(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return Number.NaN;
}

function validateCoordinates(latitude, longitude) {
  if (latitude === undefined && longitude === undefined) return null;
  if (latitude === null && longitude === null) return null;
  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    return 'Latitude and longitude must both be provided together';
  }
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90
      || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    return 'Latitude must be -90–90 and longitude must be -180–180';
  }
  return null;
}

function parseCoordinate(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return Number.NaN;
}

module.exports = { validateFarmInput, validateFieldInput };
