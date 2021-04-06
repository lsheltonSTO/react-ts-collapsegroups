import { DataResult, State } from "@progress/kendo-data-query";

export interface IKendoTestMediafluxState {
  items: any;
  dataState: State;
  result: DataResult;
  selected: Array<any>;
  collapsed: Array<any>;
}
