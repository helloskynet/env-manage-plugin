import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { EnvManage } from "./index.js";
import { Options, EnvConfig } from "./types.js";

export type Config = EnvConfig;

let hasBeenCalled = false;
export const unpluginFactory: UnpluginFactory<Options | undefined> = (
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
      envMangePlugin.startIndependent(true);
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
