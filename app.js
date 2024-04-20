import express from "express";
import { join, dirname } from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { parse, print, visit, types } from "recast";
import tsParser from "recast/parsers/babel-ts.js";
import {
  getCode,
  lucideIcons,
  shadcnRules,
} from "./common.js";

const app = express();
const PORT = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());

async function readSystemPrompt() {
  return readFile(join(__dirname, "./design-to-code-prompt.md"), { encoding: "utf8" });
}

app.get("/design-to-code", async (req, res) => {
  try {
    const systemPrompt = await readSystemPrompt();
    const result = {
        prompt: "hero section",
        images: ["https://raw.githubusercontent.com/Bayesian4042/design2code/master/hero_section.png"],
    }

    const { images, prompt} = result;
    
    const { code, usage, description } = await getCode(
        [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: [
                {
                    type: "text",
                    text: prompt,
                },
                ...images.map(
                    (image) =>
                    ({
                        type: "image_url",
                        image_url: {
                        url: image,
                        },
                    })
                ),
                ],
            },
        ],
        "gpt-4-vision-preview"
    );
    const refinedCode = refineCode(code);
    
    res.type("text/plain").send(refinedCode);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred on the server.");
  }
});

function mapImports(used, declarations) {
    const importMap = {};
    const fallbacks = [];
  
    for (const u of used) {
      let source = "";
      let fallback = false;
  
      for (const rule of shadcnRules) {
        if (new RegExp(rule.matcher).test(u)) {
          source = rule.source;
          break;
        }
      }
  
      if (!source && lucideIcons[u]) {
        source = "lucide-react";
      }
  
      if (!source && declarations.has(u)) {
        continue;
      }
  
      if (!source) {
        source = "lucide-react";
        fallback = true;
        fallbacks.push(u);
      }
  
      if (!importMap[source]) {
        importMap[source] = new Set();
      }
      importMap[source].add(fallback ? "Home" : u);
    }
  
    let importStr = "";
    for (const key in importMap) {
      const statement = `import { ${Array.from(importMap[key]).join(
        ", "
      )} } from '${key}';`;
      importStr += `${statement}\r\n`;
    }
  
    return { importStr, fallbacks };
}

function refineCode(code) {
    const fromReact = new Set();
    const usedVariables = new Set();
    const declarations = new Set();
  
    const ast = parse(code, {
      parser: tsParser,
    });
  
    visit(ast, {
      visitImportDeclaration(p) {
        const isReact =
          p.node.source.type === "StringLiteral" &&
          p.node.source.value === "react";
  
        if (!isReact) {
          p.replace();
        } else {
          for (const s of p.node.specifiers || []) {
            fromReact.add(s.local?.name.toString() || "");
          }
        }
  
        this.traverse(p);
      },
    });
  
    visit(ast, {
      visitIdentifier(p) {
        const varName = p.node.name;
        const isDecl = ["VariableDeclarator", "FunctionDeclaration"].includes(
          p.parent?.node.type
        );
  
        if (isDecl) {
          declarations.add(varName);
        }
  
        this.traverse(p);
      },
      visitJSXIdentifier(p) {
        const elName = p.node.name;
        if (
          p.parent?.node.type === "JSXOpeningElement" &&
          elName[0].toUpperCase() === elName[0] &&
          !fromReact.has(elName)
        ) {
          usedVariables.add(elName);
        }
        this.traverse(p);
      },
    });
  
    const { importStr, fallbacks } = mapImports(
      Array.from(usedVariables),
      declarations
    );
  
    visit(ast, {
      visitJSXIdentifier(p) {
        const elName = p.node.name;
        if (
          ["JSXOpeningElement", "JSXClosingElement"].includes(
            p.parent?.node.type
          ) &&
          elName[0].toUpperCase() === elName[0] &&
          !fromReact.has(elName) &&
          fallbacks.includes(elName)
        ) {
          p.replace(types.builders.jsxIdentifier("div"));
        }
        this.traverse(p);
      },
    });
  
    return importStr + print(ast).code;
  }

  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
