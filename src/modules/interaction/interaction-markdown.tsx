import Markdown from "markdown-to-jsx";
import { PreBlock } from "./syntax-highlighter";
import {
  ArrowRight,
  CheckIcon,
  CogIcon,
  EditIcon,
  EyeIcon,
  Keyboard,
  Loader2,
  SearchIcon,
} from "lucide-react";
import { TinyPreviewIcon } from "./tiny-preview-icon";

export function InteractionMarkdown({ children }) {
  const content = children;

  return (
    <>
      <Markdown
        options={{
          forceBlock: true,
          overrides: {
            code: {
              component: PreBlock,
            },
            loading: {
              props: {
                className: "w-3 h-3 animate-spin inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <Loader2 {...props}></Loader2>
                  </>
                );
              },
            },
            arrow: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <ArrowRight {...props}></ArrowRight>
                  </>
                );
              },
            },
            eye: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <EyeIcon {...props}></EyeIcon>
                  </>
                );
              },
            },
            check: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <CheckIcon {...props}></CheckIcon>
                  </>
                );
              },
            },
            search: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <SearchIcon {...props}></SearchIcon>
                  </>
                );
              },
            },
            logo: {
              props: {
                className: "w-6 h-6 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <img src="./mainlogo.png" {...props} />
                  </>
                );
              },
            },
            keyboard: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <Keyboard {...props}></Keyboard>
                  </>
                );
              },
            },
            infoText: {
              props: {
                className: "text-blue-400",
              },
              component: ({ children, ...props }) => {
                return <span {...props}>{children}</span>;
              },
            },
            cog: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <CogIcon {...props}></CogIcon>
                  </>
                );
              },
            },
            edit: {
              props: {
                className: "w-3 h-3 mr-2 inline-block",
              },
              component: (props) => {
                return (
                  <>
                    <EditIcon {...props}></EditIcon>
                  </>
                );
              },
            },
            tinyIcon: {
              component: TinyPreviewIcon,
            },
            link: {
              props: {
                className: "text-primary-foreground hover:underline",
              },
              component: (props) => {
                return <a {...props} target="_blank" />;
              },
            },
            a: {
              props: {
                className: "text-primary-foreground hover:underline",
              },
              component: (props) => {
                return <a {...props} target="_blank" />;
              },
            },
            table: {
              props: {
                className: "w-full text-left",
              },
            },
            tr: {
              props: {
                className:
                  "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
              },
            },
            th: {
              props: {
                className:
                  "h-6 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
              },
            },
            td: {
              props: {
                className:
                  "p-2 align-middle [&:has([role=checkbox])]:pr-0 font-medium",
              },
            },
            ol: {
              props: {
                className: "list-decimal mb-2 ml-4 mt-2",
              },
            },
            li: {
              props: {
                className: "mt-1",
              },
            },
          },
        }}
      >
        {content}
      </Markdown>
    </>
  );
}
//.replace(/\n/gi, '<br/>') ?? ""
