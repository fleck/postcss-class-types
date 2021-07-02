import postcss from "postcss";
import { default as plugin, options } from "../src/";
import fs from "fs-extra";
import path from "path";

async function run(input: string, opts: options) {
  let result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });

  expect(result.warnings()).toHaveLength(0);
}

const typesDirectory = path.join(__dirname, "..", "@types");

const cleanupFiles = () => {
  fs.removeSync(typesDirectory);
};

beforeEach(cleanupFiles);
afterEach(cleanupFiles);

const classNamesPath = path.join(
  typesDirectory,
  "class-types",
  "classTypes.d.ts"
);

test("generates types for classes", async () => {
  await run(".mt-1{ } .mt-2{}", {});

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});

test("does not include ids, pseudo selectors, or attributes", async () => {
  await run(
    '#app .mt-1{ } #app .mt-2:hover{} [data-reach-slider-input][data-orientation="horizontal"] {}',
    {}
  );

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});

test("supports custom directories", async () => {
  const directory = path.join(typesDirectory, "custom");

  await run("#app .mt-1{ } #app .mt-2:hover{}", { directory });

  expect(
    (await fs.readFile(path.join(directory, "classTypes.d.ts"))).toString()
  ).toMatchSnapshot();
});

test("groups", async () => {
  await run("#td .group:hover .group-hover\\:text-gray-900{}", {});

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});

test("space", async () => {
  await run(
    `.space-y-2>:not(template)~:not(template) {
       --space-y-reverse:0!important;margin-top: calc(0.5rem*(1 - var(--space-y-reverse)))!important;
       margin-bottom: calc(0.5rem*var(--space-y-reverse))!important
     }`,
    {}
  );

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});

test("comma", async () => {
  await run(
    `button,input,optgroup,select,textarea {
       font-family: inherit;
       font-size: 100%;
       line-height: 1.15;
       margin: 0
     }`,
    {}
  );

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});

test("allows escaped period", async () => {
  // prettier-ignore
  await run(".px-1\\.5{padding-left: 0.375rem; padding-right: 0.375rem;}", {});

  expect((await fs.readFile(classNamesPath)).toString()).toMatchSnapshot();
});
