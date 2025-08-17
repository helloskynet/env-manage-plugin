import { createUnplugin } from "unplugin";
import type { UnpluginFactory } from "unplugin";

import { EnvManage } from "./index.js";
import { EnvmConfigInterface } from "@envm/schemas";

let hasBeenCalled = false;
export const unpluginFactory: UnpluginFactory<EnvmConfigInterface> = (
  options
) => {
  const envMangePlugin = new EnvManage(options);

  return {
    name: "unplugin-envm",
    buildStart() {
      if (hasBeenCalled) {
        return;
      }
      hasBeenCalled = true;
      envMangePlugin.startIndependent();
    },
  };
};

export const unpluginEnvm = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unpluginEnvm;

export const envmVitePlugin = unpluginEnvm.vite;
export const envmRollupPlugin = unpluginEnvm.rollup;
export const envmRolldownPlugin = unpluginEnvm.rolldown;
export const envmWebpackPlugin = unpluginEnvm.webpack;
export const envmRspackPlugin = unpluginEnvm.rspack;
export const envmEsbuildPlugin = unpluginEnvm.esbuild;
export const envmFarmPlugin = unpluginEnvm.farm;
