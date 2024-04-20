import { config } from "dotenv";
import OpenAI from "openai";
import axiosRetry from "axios-retry";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { visitParents } from "unist-util-visit-parents";
import { remove } from "unist-util-remove";

config(); // Loads .env file into process.env

const apiKey = process.env.OPENAI_API_KEY || "";
if (!apiKey) throw new Error("Failed to get OpenAI API key");



const openai = new OpenAI({
  organization: 'org-TXQZNIw45w7KwRYLIJT41LAt',
  apiKey: apiKey
});

export async function getCode(messages, model) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model,
      max_tokens: 3000,
      temperature: 0,
    });

    console.log("raw output> ", chatCompletion.choices[0].message.content);

      const codeBlocks = [];
      const tree = fromMarkdown(chatCompletion.choices[0].text || "");

      visitParents(tree, { type: "code" }, (node) => {
        codeBlocks.push(node.value.trim());
      });

      if (codeBlocks.length !== 1) {
        throw new Error(`Invalid code blocks ${JSON.stringify(codeBlocks)}`);
      }

      remove(tree, { type: "code" });
      return {
        code: codeBlocks[0],
        description: toMarkdown(tree),
        usage: chatCompletion.usage
      };
  } catch (error) {
    console.error('Error fetching code:', error);
    throw new Error('Failed to fetch code from OpenAI');
  }
}

export const lucideIcons = {};
try {
  const iconNodes = await (
    await fetch("https://lucide.dev/api/icon-nodes")
  ).json();
  for (const key in iconNodes) {
    const newKey = key
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    lucideIcons[newKey] = iconNodes[key];
  }
} catch {}

export async function composeWorkflow(label, placeholderFiles) {
  // const { githubEvent, eventName } = await getIssueEvent();

  // console.log(
  //   githubEvent.action,
  //   eventName,
  //   githubEvent.issue,
  //   githubEvent.comment,
  //   githubEvent.actor
  // );

  // const isPr = Boolean(githubEvent.issue.pull_request);

  // if (githubEvent.issue.labels.every((l) => l.name !== label)) {
  //   throw new Error("label mismatch");
  // }

  // if (isPr && eventName === "issues") {
  //   throw new Error("non-comments event in PR");
  // }

  // if (
  //   ["issue_comment", "pull_request_review_comment"].includes(eventName) &&
  //   githubEvent.comment &&
  //   !isValidComment(githubEvent.comment, githubEvent.issue.user.login)
  // ) {
  //   throw new Error("invalid comment");
  // }

  // if (githubEvent.issue.state !== "open") {
  //   throw new Error("closed issue/PR");
  // }

  // const { owner, repo } = getOwnerAndRepo();

  // // check whitelist and quota
  // const valid = await checkValid(owner, repo, githubEvent.actor.login);
  // if (!valid) {
  //   throw new Error(
  //     "invalid request, please check the whitelist or quota config"
  //   );
  // }

  // const issue = isPr
  //   ? await getConnectedIssue(owner, repo, githubEvent.issue.body)
  //   : githubEvent.issue;

  // const branch = `${label}-issue-${issue.number}`;

  // let pr: { number: number } = { number: -1 };
  // if (isPr) {
  //   // is PR event
  //   pr = githubEvent.issue;
  // } else {
  //   const connectedPrNumber = await getConnectedPr(owner, repo, issue.number);
  //   pr = connectedPrNumber
  //     ? (
  //         await octokit.rest.pulls.get({
  //           owner,
  //           repo,
  //           pull_number: connectedPrNumber,
  //         })
  //       ).data
  //     : await applyPR(
  //         owner,
  //         repo,
  //         issue.number,
  //         branch,
  //         placeholderFiles,
  //         "[Skip CI] Dewhale: init the PR",
  //         [label]
  //       );
  // }

  const { prompt, images } = {
    prompt: "",
    images: [],
  };

  const commitMsg = JSON.stringify(
    {
      prompt,
      images,
    },
    null,
    2,
  );

  return {
    commitMsg,
    prompt,
    images,
    owner: "",
    repo: "",
    branch: "",
    issue: -1,
    pr: -1,
  };
}

export const shadcnRules = [
  {
    matcher: "^Avatar.*",
    source: "@/components/ui/avatar",
  },
  {
    matcher: "^AspectRatio",
    source: "@/components/ui/aspect-ratio",
  },
  {
    matcher: "^Badge",
    source: "@/components/ui/badge",
  },
  {
    matcher: "^Button",
    source: "@/components/ui/button",
  },
  {
    matcher: "^Card.*",
    source: "@/components/ui/card",
  },
  {
    matcher: "^Checkbox",
    source: "@/components/ui/checkbox",
  },
  {
    matcher: "^Collapsible.*",
    source: "@/components/ui/collapsible",
  },
  {
    matcher: "^Menubar.*",
    source: "@/components/ui/menubar",
  },
  {
    matcher: "^Select.*",
    source: "@/components/ui/select",
  },
  {
    matcher: "^RadioGroup.*",
    source: "@/components/ui/radio-group",
  },
  {
    matcher: "^Textarea",
    source: "@/components/ui/textarea",
  },
  {
    matcher: "^ToggleGroup.*",
    source: "@/components/ui/toggle-group",
  },
  {
    matcher: "^Toggle",
    source: "@/components/ui/toggle",
  },
  {
    matcher: "^Skeleton",
    source: "@/components/ui/skeleton",
  },
  {
    matcher: "^Slider",
    source: "@/components/ui/slider",
  },
  {
    matcher: "^Tooltip.*",
    source: "@/components/ui/tooltip",
  },
  {
    matcher: "^Label",
    source: "@/components/ui/label",
  },
  {
    matcher: "^Input",
    source: "@/components/ui/input",
  },
  {
    matcher: "^ScrollArea",
    source: "@/components/ui/scroll-area",
  },
  {
    matcher: "^Switch",
    source: "@/components/ui/switch",
  },
  {
    matcher: "^Dialog.*",
    source: "@/components/ui/dialog",
  },
  {
    matcher: "^Sheet.*",
    source: "@/components/ui/sheet",
  },
  {
    matcher: "^Separator",
    source: "@/components/ui/separator",
  },
  {
    matcher: "^NavigationMenu.*",
    source: "@/components/ui/navigation-menu",
  },
  {
    matcher: "^HoverCard.*",
    source: "@/components/ui/hover-card",
  },
  {
    matcher: "^DropdownMenu.*",
    source: "@/components/ui/dropdown-menu",
  },
  {
    matcher: "^Accordion.*",
    source: "@/components/ui/accordion",
  },
  {
    matcher: "^AlertDialog.*",
    source: "@/components/ui/alert-dialog",
  },
  {
    matcher: "^Alert.*",
    source: "@/components/ui/alert",
  },
  {
    matcher: "^Table.*",
    source: "@/components/ui/table",
  },
  {
    matcher: "^Tabs.*",
    source: "@/components/ui/tabs",
  },
  {
    matcher: "^Popover.*",
    source: "@/components/ui/popover",
  },
  {
    matcher: "^Calendar",
    source: "@/components/ui/calendar",
  },
  {
    matcher: "^Command.*",
    source: "@/components/ui/command",
  },
  {
    matcher: "^ContextMenu.*",
    source: "@/components/ui/context-menu",
  },
  {
    matcher: "^Carousel.*",
    source: "@/components/ui/carousel",
  },
  {
    matcher: "^Drawer.*",
    source: "@/components/ui/drawer",
  },
  {
    matcher: "^Pagination.*",
    source: "@/components/ui/pagination",
  },
  {
    matcher: "^Resizable.*",
    source: "@/components/ui/resizable",
  },
  {
    matcher: "^ResponsiveBar",
    source: "@nivo/bar",
  },
  {
    matcher: "^ResponsiveLine",
    source: "@nivo/line",
  },
  {
    matcher: "^ResponsivePie",
    source: "@nivo/pie",
  },
  {
    matcher: "^ResponsiveScatterPlot",
    source: "@nivo/scatterplot",
  },
  {
    matcher: "^ResponsiveHeatMap",
    source: "@nivo/heatmap",
  },
];
