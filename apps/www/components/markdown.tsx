import defaultMdxComponents from "fumadocs-ui/mdx";
import type { ElementContent, Root, RootContent } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { isValidElement, Suspense, use, useDeferredValue } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { visit } from "unist-util-visit";

import { DynamicCodeBlock } from "@/components/docs/dynamic-codeblock";

export interface Processor {
  process: (content: string) => Promise<ReactNode>;
}

const WORD_BOUNDARY_REGEX = /(?=\s)/u;

export const rehypeWrapWords = () => (tree: Root) => {
  visit(tree, ["text", "element"], (node, index, parent) => {
    if (node.type === "element" && node.tagName === "pre") {
      return "skip";
    }
    if (node.type !== "text" || !parent || index === undefined) {
      return;
    }

    const words = node.value.split(WORD_BOUNDARY_REGEX);

    // Create new span nodes for each word and whitespace
    const newNodes: ElementContent[] = words.flatMap((word) => {
      if (word.length === 0) {
        return [];
      }

      return {
        type: "element",
        tagName: "span",
        properties: {
          class: "animate-fd-fade-in",
        },
        children: [{ type: "text", value: word }],
      };
    });

    Object.assign(node, {
      type: "element",
      tagName: "span",
      properties: {},
      children: newNodes,
    } satisfies RootContent);
    return "skip";
  });
};

const createProcessor = (): Processor => {
  const processor = remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeWrapWords);

  return {
    async process(content) {
      const nodes = processor.parse({ value: content });
      const hast = await processor.run(nodes);

      return toJsxRuntime(hast, {
        development: false,
        jsx,
        jsxs,
        Fragment,
        components: {
          ...defaultMdxComponents,
          pre: Pre,
          // Images render through JSX, not this map.
          img: undefined,
        },
      });
    },
  };
};

const Pre = (props: ComponentProps<"pre">) => {
  // Markdown code blocks are a <pre> holding a single <code>.
  const code = props.children;
  if (!isValidElement(code)) {
    return null;
  }
  const codeProps = code.props as ComponentProps<"code">;
  const content = codeProps.children;
  if (typeof content !== "string") {
    return null;
  }

  let lang =
    codeProps.className
      ?.split(" ")
      .find((v) => v.startsWith("language-"))
      ?.slice("language-".length) ?? "text";

  if (lang === "mdx") {
    lang = "md";
  }

  return <DynamicCodeBlock code={content.trimEnd()} lang={lang} />;
};

const processor = createProcessor();

export const Markdown = ({ text }: { text: string }) => {
  const deferredText = useDeferredValue(text);

  return (
    <Suspense fallback={<p className="invisible">{text}</p>}>
      <Renderer text={deferredText} />
    </Suspense>
  );
};

const cache = new Map<string, Promise<ReactNode>>();

const Renderer = ({ text }: { text: string }) => {
  const result = cache.get(text) ?? processor.process(text);
  cache.set(text, result);

  return use(result);
};
