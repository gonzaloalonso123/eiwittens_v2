export const defaultProduct = {
  name: "",
  store: "",
  url: "",
  ammount: "",
  protein_per_100_g: "",
  image: "",
  trust_pilot_url: "",
  type: "",
  price: "",
  discount_type: "",
  discount_code: "",
  discount_value: "",
  enabled: true,
  actions: [],
};

export const productTypes = [
  { name: "Protein", value: "protein" },
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
  { name: "Caseïne", value: "casein" },
  { name: "Biologische eiwitpoeder", value: "organic_protein" },
  { name: "Paleo eiwitpoeder", value: "paleo_protein" },
  { name: "Eiwitpoeder Zonder Zoetstof", value: "unsweetened_protein" },
  { name: "Proteïne Milkshake", value: "protein_milkshake" },
  { name: "Lactosevrij proteïne poeder", value: "lactose_free_protein" },
  { name: "Diet Whey", value: "diet_whey" },
  { name: "Protein Coffee", value: "protein_coffee" },
];

export const productSubtypes = {
  protein: proteinTypes,
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
