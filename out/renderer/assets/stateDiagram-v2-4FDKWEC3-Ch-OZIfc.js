import { s as styles_default, b as stateRenderer_v3_unified_default, a as stateDiagram_default, S as StateDB } from "./chunk-DI55MBZ5-t7PNirwr.js";
import { _ as __name } from "./index-BMJ-AusB.js";
import "./chunk-55IACEB6-BzwgymgU.js";
import "./chunk-QN33PNHL-BZk8LDTW.js";
import "./proxy-Cyukx2zO.js";
var diagram = {
  parser: stateDiagram_default,
  get db() {
    return new StateDB(2);
  },
  renderer: stateRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};
