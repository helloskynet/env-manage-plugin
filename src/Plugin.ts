import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { AppOptions, EnvManage } from "./index.js";

export interface Options extends AppOptions {}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  options
) => ({
  name: "unplugin-envm",
  buildStart() {
    const envMangePlugin = new EnvManage(options);

    envMangePlugin.startIndependent();
  },
});

export const envmPlugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default envmPlugin;

export const vitePlugin = envmPlugin.vite;
export const rollupPlugin = envmPlugin.rollup;
export const rolldownPlugin = envmPlugin.rolldown;
export const webpackPlugin = envmPlugin.webpack;
export const rspackPlugin = envmPlugin.rspack;
export const esbuildPlugin = envmPlugin.esbuild;
export const farmPlugin = envmPlugin.farm;
