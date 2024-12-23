export const defaultProduct = {
  name: "",
  store: "",
  url: "",
  ammount: 0,
  protein_per_100g: 0,
  sugar_per_100g: 0,
  creatine_per_100g: 0,
  calories_per_100g: 0,
  image: "",
  trustpilot_url: "",
  type: "",
  subtypes: [],
  price: "",
  discount_type: "",
  discount_code: "",
  discount_value: null,
  scraper: [],
  count_clicked: [],
  price_history: [],
  count_top10: [],
  enabled: true,
  enabled_top10: true,
  scrape_enabled: true,
};

export const productTypes = [
  { name: "Proteine", value: "proteine" },
  { name: "Preworkout", value: "preworkout" },
  { name: "Creatine", value: "creatine" },
  { name: "BCAA", value: "bcaa" },
  { name: "Fat Burner", value: "fatburner" },
  { name: "Vitamin", value: "vitamin" },
];

const proteinTypes = [
  { name: "Whey Proteïne", value: "whey_protein" },
  { name: "Whey Isolate", value: "whey_isolate" },
  { name: "Weight Gainer", value: "weight_gainer" },
  { name: "Vegan Proteïne", value: "vegan_protein" },
  { name: "Clear whey", value: "clear_whey" },
  { name: "Collageen Eiwit", value: "collagen_protein" },
  { name: "Ei Eiwit", value: "egg_protein" },
  { name: "Beef Proteïne", value: "beef_protein" },
  { name: "Caseïne", value: "caseine" },
  { name: "Biologische eiwitpoeder", value: "organic_protein" },
  { name: "Paleo eiwitpoeder", value: "paleo_protein" },
  { name: "Eiwitpoeder Zonder Zoetstof", value: "unsweetened_protein" },
  { name: "Proteïne Milkshake", value: "protein_milkshake" },
  { name: "Lactosevrij proteïne poeder", value: "lactose_free_protein" },
  { name: "Diet Whey", value: "diet_whey" },
  { name: "Protein Coffee", value: "protein_coffee" },
  { name: "Whey Hydro", value: "whey_hydro" },
  { name: "Whey Concentraat", value: "whey_concentrate" },
];

export const productSubtypes = {
  proteine: proteinTypes,
  preworkout: ["Preworkout"],
  creatine: ["Creatine"],
  bcaa: ["BCAA"],
  fatburner: ["Fat Burner"],
  vitamin: ["Vitamin"],
};

export const defaultAction = {
  type: "select",
  selector: "xpath",
  xpath: "",
};

export const actionTypes = [
  { name: "Click", value: "click" },
  { name: "Select", value: "select" },
  { name: "Select Option", value: "selectOption" },
  { name: "Wait", value: "wait" },
];

export const discountTypes = [
  { name: "Percentage", value: "percentage" },
  { name: "Value", value: "value" },
];
