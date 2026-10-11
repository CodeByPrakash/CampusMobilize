"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SparklesIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  CheckCircle2Icon,
  CopyIcon,
  CheckIcon,
  FileTextIcon,
  LayersIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

interface SimulationAiAssessmentProps {
  rawMarkdown: string;
}

// Inline formatting helper for **bold**, *italic*, `code`, and <br>
export function FormattedText({ text }: { text: string }) {
  if (!text) return null;

  // Split by <br>, <br/>, or <br /> tags
  const brSegments = text.split(/<br\s*\/?>/gi);

  return (
    <>
      {brSegments.map((seg, brIdx) => (
        <React.Fragment key={brIdx}>
          {brIdx > 0 && <span className="block my-1" />}
          {renderInlineTokens(seg)}
        </React.Fragment>
      ))}
    </>
  );
}

function renderInlineTokens(str: string) {
  // Regex to match **bold** or `code`
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="font-mono text-[11px] bg-muted/80 text-primary px-1 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

type ParsedBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "h4"; text: string }
  | { type: "h5"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseMarkdownIntoBlocks(md: string): ParsedBlock[] {
  const lines = md.split("\n");
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines or pure hr lines
    if (!line || line === "---") {
      i++;
      continue;
    }

    // Markdown Headings: #, ##, ###, ####, #####, ######
    const headingMatch = line.match(/^(#{1,6})\s*(.*)$/);
    if (headingMatch && headingMatch[2].trim().length > 0) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 1) blocks.push({ type: "h1", text });
      else if (level === 2) blocks.push({ type: "h2", text });
      else if (level === 3) blocks.push({ type: "h3", text });
      else if (level === 4) blocks.push({ type: "h4", text });
      else blocks.push({ type: "h5", text });
      i++;
      continue;
    }

    // Table detection: starts and ends with | or contains multiple |
    if (line.startsWith("|") && line.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Line 0 is header, Line 1 is divider (|---|---|)
        const parseCells = (rowStr: string) =>
          rowStr
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());

        const headers = parseCells(tableLines[0]);
        const dataRows = tableLines
          .slice(2) // skip header & separator
          .map(parseCells)
          .filter((row) => row.some((cell) => cell.length > 0));

        blocks.push({ type: "table", headers, rows: dataRows });
        continue;
      }
    }

    // Bullet List
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") ||
          lines[i].trim().startsWith("* ") ||
          lines[i].trim().startsWith("• "))
      ) {
        listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items: listItems });
      continue;
    }

    // Regular Paragraph
    blocks.push({ type: "paragraph", text: line });
    i++;
  }

  return blocks;
}

export function SimulationAiAssessment({ rawMarkdown }: SimulationAiAssessmentProps) {
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"refined" | "raw">("refined");

  const blocks = React.useMemo(() => parseMarkdownIntoBlocks(rawMarkdown), [rawMarkdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    toast.success("Copied assessment to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const getSectionIcon = (heading: string) => {
    const h = heading.toLowerCase();
    if (h.includes("vulnerab") || h.includes("risk") || h.includes("hazard")) {
      return <AlertTriangleIcon className="size-4 text-amber-500" />;
    }
    if (h.includes("prevent") || h.includes("action") || h.includes("measure")) {
      return <ShieldCheckIcon className="size-4 text-primary" />;
    }
    if (h.includes("saving") || h.includes("cost") || h.includes("resource") || h.includes("impact")) {
      return <TrendingUpIcon className="size-4 text-emerald-500" />;
    }
    if (h.includes("tl;dr") || h.includes("board") || h.includes("executive")) {
      return <SparklesIcon className="size-4 text-primary" />;
    }
    return <InfoIcon className="size-4 text-primary" />;
  };

  return (
    <div className="space-y-4">
      {/* Assessment Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-card p-3 rounded-lg border shadow-2xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono gap-1 text-primary border-primary/30 bg-primary/5">
            <SparklesIcon className="size-3" />
            <span>DeepBot Engineering Synthesis</span>
          </Badge>
          <span className="text-xs text-muted-foreground">• NIT Rourkela Digital Twin</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "refined" ? "raw" : "refined")}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LayersIcon className="size-3" />
            <span>{viewMode === "refined" ? "Raw Markdown" : "Refined UI"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5 shadow-2xs"
          >
            {copied ? (
              <>
                <CheckIcon className="size-3 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Raw Markdown Fallback Mode */}
      {viewMode === "raw" ? (
        <div className="rounded-lg border bg-muted/20 p-4 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {rawMarkdown}
        </div>
      ) : (
        /* Refined Executive UI View */
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            switch (block.type) {
              case "h1":
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 pt-4 pb-1.5 border-b border-border text-foreground"
                  >
                    <SparklesIcon className="size-4 text-primary" />
                    <h2 className="text-base font-bold tracking-tight text-foreground">
                      <FormattedText text={block.text} />
                    </h2>
                  </div>
                );

              case "h2":
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 pt-3 pb-1 border-b border-border/80 text-foreground"
                  >
                    {getSectionIcon(block.text)}
                    <h3 className="text-sm font-bold tracking-tight text-foreground">
                      <FormattedText text={block.text} />
                    </h3>
                  </div>
                );

              case "h3":
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 pt-2.5 text-foreground font-semibold text-xs"
                  >
                    {getSectionIcon(block.text)}
                    <h4 className="text-xs font-semibold text-foreground">
                      <FormattedText text={block.text} />
                    </h4>
                  </div>
                );

              case "h4":
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 pt-2 pb-0.5 text-foreground font-semibold text-xs"
                  >
                    <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    <h5 className="text-xs font-semibold text-foreground tracking-tight">
                      <FormattedText text={block.text} />
                    </h5>
                  </div>
                );

              case "h5":
                return (
                  <div
                    key={idx}
                    className="pt-1.5 pb-0.5 text-foreground font-medium text-[11px]"
                  >
                    <h6 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <FormattedText text={block.text} />
                    </h6>
                  </div>
                );

              case "table":
                return (
                  <div key={idx} className="rounded-lg border bg-card overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <tr>
                            {block.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="px-3.5 py-2.5 font-semibold text-foreground border-r last:border-r-0"
                              >
                                <FormattedText text={h} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground">
                          {block.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-muted/20 transition-colors even:bg-muted/5"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="px-3.5 py-2.5 text-xs text-foreground border-r last:border-r-0 align-top leading-relaxed"
                                >
                                  <FormattedText text={cell} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );

              case "list":
                return (
                  <div key={idx} className="rounded-lg border bg-card p-3 space-y-2 shadow-2xs">
                    {block.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                        <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <FormattedText text={item} />
                        </div>
                      </div>
                    ))}
                  </div>
                );

              case "paragraph":
                return (
                  <p key={idx} className="text-xs text-foreground leading-relaxed">
                    <FormattedText text={block.text} />
                  </p>
                );

              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
}
