import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { AppOptions, EnvManage } from "./index.js";

export interface Options extends AppOptions {}

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

export const envmPlugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default envmPlugin;

export const envmVitePlugin = envmPlugin.vite;
export const envmRollupPlugin = envmPlugin.rollup;
export const envmRolldownPlugin = envmPlugin.rolldown;
export const envmWebpackPlugin = envmPlugin.webpack;
export const envmRspackPlugin = envmPlugin.rspack;
export const envmEsbuildPlugin = envmPlugin.esbuild;
export const envmFarmPlugin = envmPlugin.farm;
