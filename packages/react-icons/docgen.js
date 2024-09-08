const glob = require("glob");
const fs = require("fs/promises");

// read all files ../../assets/**/*.metadata.json
const files = glob.sync("../../assets/**/metadata.json");

async function processFiles(files) {
  const docstrings = await Promise.all(
    files.map(async (file) => {
      const metadata = require(file);
      const componentName = metadata.name.split(" ").join("");
      const styleRemark = metadata.style?.length === 2 ? "" : `Only available in ${metadata.style.join(", ")} style`;
      const metaphor = metadata.metaphor?.length ? `${metadata.metaphor.join(", ")}` : "";
      // remove the trailing . in the description
      const description = (metadata.description ?? "").replace(/\.$/, "");
      const docstring = [componentName, description, styleRemark, metaphor]
        .map((s) => normalizeSpace(s).trim())
        .filter(Boolean)
        .join(" | ");
      return docstring;
    })
  );

  // output to ./dist/docstrings.txt
  await fs.mkdir("./dist", { recursive: true });
  await fs.writeFile("./dist/catalog.txt", docstrings.join("\n"));
}

function normalizeSpace(str) {
  // replace all whitespace, newline, tab, etc with a single space
  return str.replace(/\s+/g, " ");
}

processFiles(files);
