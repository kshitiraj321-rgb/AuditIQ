export function classifyDocument(fileName: string) {
  const name = fileName.toLowerCase();

  if (name.includes("po")) {
    return "Purchase Order";
  }

  if (name.includes("grn")) {
    return "Goods Receipt Note";
  }

  if (name.includes("inv") || name.includes("invoice")) {
    return "Vendor Invoice";
  }

  return "Unknown";
}