import * as appRoot from "app-root-path";
import createSelectorParser from "postcss-selector-parser";
import nodePath from "path";
import fs from "fs-extra";
import postcssLib, { plugin } from "postcss";

export const defaultDirectory = nodePath.join(
  appRoot.toString(),
  "@types",
  "ct.macro"
);

export const classNamesDeclarationFilename = "classNames.d.ts";

const parser = createSelectorParser(selectors => {
  selectors.each(selector => {
    if (selector.type !== "selector") {
      selector.remove();
      return;
    }

    selector.walk(node => {
      if (!["class", "combinator"].includes(node.type)) {
        node.remove();
      }
    });
  });
});

const autoGeneratedFileWarning =
  "// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.\n";

const initializer = ({ directory = "" } = {}) => {
  const dest = directory || defaultDirectory;

  const indexFileOutput = fs.outputFile(
    nodePath.join(dest, "index.d.ts"),
    `\
${autoGeneratedFileWarning}
declare module "ct.macro" {
const _default: (...args: ClassNames[]) => string;

export default _default;
}`
  );

  return async (root: postcssLib.Root) => {
    const classes = new Set<string>();

    root.walkRules(rule => {
      parser.processSync(rule.selector, {
        lossless: false,
        updateSelector: false,
      });

      parser
        .processSync(rule.selector, {
          lossless: false,
          updateSelector: false,
        })
        .trim()
        .replace(/\./g, "")
        .replace(/\\/g, "")
        .split(" ")
        .filter(Boolean)
        .forEach(cssClass => classes.add(cssClass));
    });

    return Promise.all([
      indexFileOutput,
      fs.outputFile(
        nodePath.join(dest, classNamesDeclarationFilename),
        `${autoGeneratedFileWarning}type ClassNames = "${Array.from(
          classes
        ).join('" | "')}"`
      ),
    ]);
  };
};

export type options = Parameters<typeof initializer>[0];

export default plugin<options>("postcss-class-types", initializer);

export const postcss = true;
