import { CellId, CellInfo } from "@holochain/client";


export function getCellId(cellInfo: CellInfo): CellId | undefined {
  if ("Provisioned" in cellInfo) {
    return cellInfo.Provisioned.cell_id;
  }
  if ("Cloned" in cellInfo) {
    return cellInfo.Cloned.cell_id;
  }
  return undefined;
}