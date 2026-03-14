declare module "postcss-rem-to-pixel" {
  interface RemToPxOptions {
    rootValue?: number;
    propList?: string[];
    selectorBlackList?: (string | RegExp)[];
    replace?: boolean;
    mediaQuery?: boolean;
    minPixelValue?: number;
  }

  function remToPx(options?: RemToPxOptions): import("postcss").Plugin;
  export default remToPx;
}
