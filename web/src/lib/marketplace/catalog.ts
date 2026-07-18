const PRODUCT_ID_BY_CODE: Record<string, string> = {
  ALPACA_FIBER: "prod-fibra-alpaca",
  ONION: "prod-cebolla",
  QUINOA: "prod-quinua",
  TROUT: "prod-trucha",
};

const IMAGE_BY_PRODUCT_ID: Record<string, string> = {
  "prod-fibra-alpaca": "/images/alpaca-field.jpg",
  "prod-cebolla": "/images/cebolla.jpg",
  "prod-papa-canchan": "/images/papa-canchan.jpg",
  "prod-papa-imilla": "/images/papa-imilla.jpg",
  "prod-quinua": "/images/quinua-sacks.jpg",
  "prod-trucha": "/images/trucha.jpg",
};

export function getCatalogProductId(productCode: string, varietyCode: string | null) {
  return productCode === "POTATO"
    ? varietyCode === "IMILLA_NEGRA" ? "prod-papa-imilla" : "prod-papa-canchan"
    : PRODUCT_ID_BY_CODE[productCode];
}

export function getDefaultProductImage(productCode: string, varietyCode: string | null) {
  const productId = getCatalogProductId(productCode, varietyCode);
  return productId ? IMAGE_BY_PRODUCT_ID[productId] : undefined;
}
