const glob = require("glob");
const fs = require("fs/promises");
const _ = require("lodash");
const runtimeIcons = require("./temp/react-icons/lib-cjs/index.js");

// read all files ../../assets/**/*.metadata.json
const files = glob.sync("../../assets/**/metadata.json");

async function processFiles(files) {
  const jsonItems = await Promise.all(
    files.map(async (file) => {
      const metadata = require(file);

      const name = firstLetterUpperCase(
        _.camelCase(
          metadata.name
            .split(/\s|-/)
            .map((part) => part.toLowerCase())
            .join(" ")
        )
      );

      const firstStyle = metadata.style[0];
      const testName = `${name}${firstLetterUpperCase(firstStyle)}`;
      if (!runtimeIcons[testName]) {
        console.log(`Icon not found: ${testName}`);
        return null;
      }
      const styleRemark = metadata.style?.length === 2 ? "" : `Only available in ${metadata.style.join(", ")} style`;
      const metaphor = metadata.metaphor?.length ? `${metadata.metaphor.join(", ")}` : "";
      const description = (metadata.description ?? "").replace(/\.$/, "");

      const jsonItem = {
        name,
        metaphor: normalizeSpace(metaphor).trim(),
        description: normalizeSpace(description).trim(),
        styleRemark: styleRemark,
      };

      return jsonItem;
    })
  );

  const docStrings = jsonItems
    .filter(Boolean)
    .map(compressDescription)
    .map((item) => {
      return Object.values(item).filter(Boolean).join(" | ");
    });

  // output to ./dist/docstrings.txt
  await fs.mkdir("./dist", { recursive: true });
  await fs.writeFile("./dist/catalog.txt", docStrings.join("\n"));
  await fs.writeFile("./dist/catalog.json", JSON.stringify(jsonItems, null, 2));
}

function normalizeSpace(str) {
  // replace all whitespace, newline, tab, etc with a single space
  return str.replace(/\s+/g, " ");
}

// when consecutive items have the same description, clear the description except for the first item
function compressDescription(item, index, jsonItems) {
  const compressedDescription = index > 0 && item.description === jsonItems[index - 1].description ? "" : item.description;
  const compressedMetaphor = index > 0 && item.metaphor === jsonItems[index - 1].metaphor ? "" : item.metaphor;

  return { ...item, description: compressedDescription, metaphor: compressedMetaphor };
}

function firstLetterUpperCase(str) {
  return str.replace(str[0], str[0].toUpperCase());
}

processFiles(files);

/** prompt example
Use the following icon set to help user choose the best icon(s). The documentation has the format

IconNamePrefix | metaphors | remarks

Each IconNamePrefix must use one of the two style suffix: "Regular", "Filled". e.g. "AccessTimeRegular", "AccessTimeFilled".  Use "Regular" suffix unless documentation or user provided explicit instruction.

...

Wrap the icon in <icon></icon> tags. Now respond in this format:

<icon>BestIconNameWithSuffix</icon>
<icon>AlternativeIconNameWithSuffix</icon>
*/
