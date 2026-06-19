/**
 * Local carbon estimates database — 20 common activities.
 * Removes dependency on the paid Carbon Interface API.
 * All values are in kg CO₂e. Sources: EPA, IPCC AR6, Our World in Data.
 */
const carbonEstimates = {
  transport: [
    { id: "car_petrol_1km",      label: "Petrol Car (per km)",        co2PerUnit: 0.21,   unit: "km",     icon: "Car" },
    { id: "car_diesel_1km",      label: "Diesel Car (per km)",        co2PerUnit: 0.171,  unit: "km",     icon: "CarFront" },
    { id: "car_electric_1km",    label: "Electric Car (per km)",      co2PerUnit: 0.053,  unit: "km",     icon: "Zap" },
    { id: "motorbike_1km",       label: "Motorbike (per km)",         co2PerUnit: 0.113,  unit: "km",     icon: "Bike" },
    { id: "bus_1km",             label: "City Bus (per km)",          co2PerUnit: 0.089,  unit: "km",     icon: "Bus" },
    { id: "train_1km",           label: "Train (per km)",             co2PerUnit: 0.041,  unit: "km",     icon: "Train" },
    { id: "domestic_flight_1km", label: "Domestic Flight (per km)",   co2PerUnit: 0.255,  unit: "km",     icon: "Plane" },
    { id: "intl_flight_1km",     label: "Int'l Flight (per km)",      co2PerUnit: 0.195,  unit: "km",     icon: "PlaneTakeoff" },
  ],
  energy: [
    { id: "electricity_1kwh",    label: "Grid Electricity (per kWh)", co2PerUnit: 0.82,   unit: "kWh",    icon: "Plug",  note: "India grid avg" },
    { id: "natural_gas_1m3",     label: "Natural Gas (per m³)",       co2PerUnit: 2.0,    unit: "m³",     icon: "Flame" },
    { id: "lpg_1kg",             label: "LPG Cooking (per kg)",       co2PerUnit: 2.98,   unit: "kg",     icon: "CookingPot" },
    { id: "ac_1hr",              label: "Air Conditioning (per hr)",  co2PerUnit: 0.82,   unit: "hour",   icon: "Snowflake" },
  ],
  food: [
    { id: "beef_1kg",            label: "Beef (per kg)",              co2PerUnit: 27.0,   unit: "kg",     icon: "Beef" },
    { id: "chicken_1kg",         label: "Chicken (per kg)",           co2PerUnit: 6.9,    unit: "kg",     icon: "Drumstick" },
    { id: "fish_1kg",            label: "Fish (per kg)",              co2PerUnit: 6.1,    unit: "kg",     icon: "Fish" },
    { id: "dairy_1l",            label: "Dairy Milk (per litre)",     co2PerUnit: 3.15,   unit: "litre",  icon: "Milk" },
    { id: "veg_meal",            label: "Vegetarian Meal",            co2PerUnit: 0.7,    unit: "meal",   icon: "Salad" },
    { id: "vegan_meal",          label: "Vegan Meal",                 co2PerUnit: 0.4,    unit: "meal",   icon: "Leaf" },
  ],
  shopping: [
    { id: "new_tshirt",          label: "New T-shirt",                co2PerUnit: 7.0,    unit: "item",   icon: "Shirt" },
    { id: "new_jeans",           label: "New Pair of Jeans",          co2PerUnit: 33.4,   unit: "item",   icon: "Shirt" },
    { id: "new_smartphone",      label: "New Smartphone",             co2PerUnit: 70.0,   unit: "item",   icon: "Smartphone" },
    { id: "online_order",        label: "Online Order (packaging)",   co2PerUnit: 0.5,    unit: "order",  icon: "Package" },
  ],
}

/**
 * Lookup a specific activity by id.
 * @param {string} activityId
 * @returns {object|undefined}
 */
export function getEstimate(activityId) {
  for (const category of Object.values(carbonEstimates)) {
    const found = category.find(a => a.id === activityId)
    if (found) return found
  }
  return undefined
}

/**
 * Get all estimates for a given category.
 * @param {'transport'|'energy'|'food'|'shopping'} categoryKey
 */
export function getCategoryEstimates(categoryKey) {
  return carbonEstimates[categoryKey] || []
}

/**
 * Calculate CO₂ for a given activity + quantity.
 * @param {string} activityId
 * @param {number} quantity
 * @returns {number} kg CO₂e
 */
export function calculateCO2(activityId, quantity) {
  const est = getEstimate(activityId)
  if (!est) return 0
  return parseFloat((est.co2PerUnit * quantity).toFixed(3))
}

export default carbonEstimates
