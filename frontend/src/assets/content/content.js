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
  { name: "Whey", value: "whey" },
  { name: "Clear Whey", value: "clear_whey" },
  { name: "Whey Isolate", value: "whey_isolate" },
  { name: "Vegan", value: "vegan" },
  { name: "Milk Shake", value: "milk_shake" },
  { name: "Caseine", value: "caseine" },
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
