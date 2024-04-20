import express from "express";
import { join, dirname } from "path";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { parse, print, visit, types } from "recast";
import tsParser from "recast/parsers/babel-ts.js";
import {
  getCode,
  lucideIcons,
  composeWorkflow,
  shadcnRules,
} from "./common.js";

const app = express();
const PORT = 3000;

// Update __dirname for ES Modules in Node.js
const __dirname = dirname(fileURLToPath(import.meta.url));
const uiGenLabel = `ui-gen`;

// Middleware to parse JSON bodies
app.use(express.json());

// Asynchronously read the system prompt markdown file
async function readSystemPrompt() {
  return readFile(join(__dirname, "./ui-gen.md"), { encoding: "utf8" });
}

app.get("/ui-gen", async (req, res) => {
  try {
    const systemPrompt = await readSystemPrompt();
    console.log("system prompt:", systemPrompt);

    const placeholderCode = `export default function Preview() { return <p> placeholder</p>; }`;
    // const result = await composeWorkflow(uiGenLabel, {
    //   "preview-ui/src/Preview.jsx": placeholderCode,
    // });

    // if (!result) {
    //   return res.status(404).send("No result available");
    // }
    const result = {
        prompt: "",
        images: [],
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

  console.log(JSON.stringify(usage, null, 2));

  console.log("refined", refineCode(code));

  console.log("description", description);
    const refinedCode = refineCode(code);

    res.type("text/plain").send(refinedCode);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred on the server.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
