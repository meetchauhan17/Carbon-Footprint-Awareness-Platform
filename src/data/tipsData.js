import {
  Car, Bus, Bike, Settings, Globe, Gauge, Snowflake, Lightbulb, Shirt,
  Thermometer, Plug, Droplets, Sun, Leaf, Calendar, Utensils, Salad,
  ShoppingBag, Wrench, Package, BookOpen, Home
} from 'lucide-react'

export const TIPS_DATA = [
  // TRANSPORT (6 tips)
  { id: 't-carpool', title: 'Carpool to work', description: 'Share rides with colleagues. Carpooling halves your transport emissions while cutting fuel costs.', category: 'Transport', co2Saved: 2.4, difficulty: 'easy', icon: Car },
  { id: 't-transit', title: 'Use public transit', description: 'Take buses or trains instead of driving alone. Public transit emits 60-80% less CO₂ per passenger.', category: 'Transport', co2Saved: 4.2, difficulty: 'medium', icon: Bus },
  { id: 't-cycle', title: 'Cycle or walk short trips', description: 'Replace car trips under 3 km with cycling or walking to save emissions and get active.', category: 'Transport', co2Saved: 1.2, difficulty: 'easy', icon: Bike },
  { id: 't-tire', title: 'Maintain correct tire pressure', description: 'Properly inflated tires improve fuel efficiency by up to 3% and extend tire life.', category: 'Transport', co2Saved: 0.3, difficulty: 'easy', icon: Settings },
  { id: 't-errands', title: 'Combine multiple errands', description: 'Plan your route and combine multiple errands into one trip to avoid unnecessary driving.', category: 'Transport', co2Saved: 1.5, difficulty: 'easy', icon: Globe },
  { id: 't-moderate', title: 'Drive at moderate speeds', description: 'Avoid aggressive acceleration and speeding. Driving at moderate speeds improves fuel economy.', category: 'Transport', co2Saved: 0.6, difficulty: 'easy', icon: Gauge },

  // HOME ENERGY (7 tips)
  { id: 'e-ac-temp', title: 'Set AC to 24°C instead of 18°C', description: 'Adjust your air conditioning settings. Setting it to 24°C reduces electricity consumption significantly.', category: 'Home Energy', co2Saved: 0.8, difficulty: 'easy', icon: Snowflake },
  { id: 'e-led', title: 'Switch to LED lightbulbs', description: 'Replace old incandescent bulbs with LEDs. LEDs use 75% less energy and last 25× longer.', category: 'Home Energy', co2Saved: 0.5, difficulty: 'easy', icon: Lightbulb },
  { id: 'e-dryer', title: 'Air-dry laundry instead of tumble dry', description: 'Skip the energy-intensive clothes dryer and air-dry your laundry on a rack or line.', category: 'Home Energy', co2Saved: 2.3, difficulty: 'easy', icon: Shirt },
  { id: 'e-thermostat', title: 'Install a smart thermostat', description: 'Use a programmable thermostat to optimize heating and cooling schedules based on when you are home.', category: 'Home Energy', co2Saved: 1.8, difficulty: 'medium', icon: Thermometer },
  { id: 'e-unplug', title: 'Unplug standby electronics', description: 'Phantom loads from devices left on standby account for 5-10% of household electricity use.', category: 'Home Energy', co2Saved: 0.4, difficulty: 'easy', icon: Plug },
  { id: 'e-cold-wash', title: 'Wash clothes in cold water', description: '90% of a washing machine\'s energy goes to heating water. Wash clothes in cold cycles.', category: 'Home Energy', co2Saved: 0.6, difficulty: 'easy', icon: Droplets },
  { id: 'e-solar', title: 'Switch to solar energy tariff', description: 'Install solar panels or switch to a utility provider that generates 100% renewable power.', category: 'Home Energy', co2Saved: 5.2, difficulty: 'hard', icon: Sun },

  // FOOD (6 tips)
  { id: 'f-meatfree', title: 'One meat-free day per week', description: 'Go vegetarian or vegan one day a week. Reducing meat consumption reduces global greenhouse gases.', category: 'Food', co2Saved: 3.5, difficulty: 'easy', icon: Leaf },
  { id: 'f-waste', title: 'Reduce food waste', description: 'Plan meals, write shopping lists, and store leftovers properly to prevent food from rotting in landfills.', category: 'Food', co2Saved: 1.1, difficulty: 'easy', icon: Calendar },
  { id: 'f-local', title: 'Buy local and seasonal produce', description: 'Support local farms. Locally sourced food avoids long transport routes and packaging emissions.', category: 'Food', co2Saved: 0.8, difficulty: 'medium', icon: Utensils },
  { id: 'f-compost', title: 'Compost organic food scraps', description: 'Turn food waste into rich compost rather than throwing it in trash where it creates methane.', category: 'Food', co2Saved: 0.5, difficulty: 'medium', icon: Leaf },
  { id: 'f-chicken', title: 'Switch beef for chicken', description: 'Replace red meat with lower-impact chicken, pork, or fish. Beef is significantly more carbon-intensive.', category: 'Food', co2Saved: 8.2, difficulty: 'easy', icon: Utensils },
  { id: 'f-plantbased', title: 'Adopt a plant-based diet', description: 'Eat primarily grains, legumes, vegetables, and fruits. Plant foods have the lowest emissions.', category: 'Food', co2Saved: 4.5, difficulty: 'hard', icon: Salad },

  // SHOPPING (6 tips)
  { id: 's-secondhand', title: 'Buy second-hand clothing', description: 'Thrift or buy pre-owned clothing. Extending a garment\'s life by 9 months reduces its footprint by 20-30%.', category: 'Shopping', co2Saved: 8.2, difficulty: 'easy', icon: Shirt },
  { id: 's-bags', title: 'Avoid single-use plastic bags', description: 'Bring your own canvas bag for groceries and shopping to prevent plastic production emissions.', category: 'Shopping', co2Saved: 0.2, difficulty: 'easy', icon: ShoppingBag },
  { id: 's-repair', title: 'Repair electronics instead of buying new', description: 'Fix your phone, laptop, or appliances. Extending device lifespans cuts manufacturing emissions.', category: 'Shopping', co2Saved: 50.0, difficulty: 'hard', icon: Wrench },
  { id: 's-appliances', title: 'Purchase energy-efficient appliances', description: 'Look for ENERGY STAR ratings when replacing old appliances to guarantee low electricity use.', category: 'Shopping', co2Saved: 1.2, difficulty: 'medium', icon: Plug },
  { id: 's-rent', title: 'Borrow or rent tools you rarely use', description: 'Instead of purchasing tools or items you\'ll use once, borrow them from a neighbor or rent them.', category: 'Shopping', co2Saved: 15.0, difficulty: 'easy', icon: Wrench },
  { id: 's-packaging', title: 'Buy products with minimal packaging', description: 'Choose loose produce and items with recyclable or minimal paper packaging.', category: 'Shopping', co2Saved: 0.4, difficulty: 'easy', icon: Package },

  // LIFESTYLE (6 tips)
  { id: 'l-tree', title: 'Plant a native tree', description: 'Plant a tree in your yard or support verified tree-planting charities. A single tree offsets ~21kg CO₂/year.', category: 'Lifestyle', co2Saved: 21.0, difficulty: 'medium', icon: Leaf },
  { id: 'l-shower', title: 'Take shorter showers (under 5 mins)', description: 'Reduce shower time to save water and the gas or electricity required to heat it.', category: 'Lifestyle', co2Saved: 0.9, difficulty: 'easy', icon: Droplets },
  { id: 'l-paperless', title: 'Opt for paperless bills', description: 'Switch your utility, bank, and mobile statements to digital-only formats to save paper resources.', category: 'Lifestyle', co2Saved: 0.1, difficulty: 'easy', icon: BookOpen },
  { id: 'l-browser', title: 'Switch to a green web browser', description: 'Use Ecosia as your search engine. Ecosia uses ad revenue to plant trees around the world.', category: 'Lifestyle', co2Saved: 0.05, difficulty: 'easy', icon: Globe },
  { id: 'l-reforest', title: 'Support local reforestation projects', description: 'Contribute to local forest conservation groups that restore native habitats and capture carbon.', category: 'Lifestyle', co2Saved: 50.0, difficulty: 'easy', icon: Leaf },
  { id: 'l-garden', title: 'Start a home vegetable garden', description: 'Grow your own herbs, greens, or tomatoes. Reduces the carbon footprint of transport packaging.', category: 'Lifestyle', co2Saved: 1.5, difficulty: 'medium', icon: Home }
]
