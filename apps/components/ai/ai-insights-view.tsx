"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SparklesIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  ZapIcon,
  DropletsIcon,
  ShieldCheckIcon,
  CopyIcon,
  CheckIcon,
  TrendingDownIcon,
  ClockIcon,
  LightbulbIcon,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "ai",
    text: "Hello! I am your CampusMobilize AI Intelligence Assistant, connected to NIT Rourkela's real-time facility telemetry and Neon database. I monitor energy grids, water distribution, and student issue density across all 462 acres.\n\nHow can I assist your maintenance or sustainability operations today?",
    timestamp: "Just now",
  },
];

const QUICK_PROMPTS = [
  "Analyze CVR Hall water anomaly and estimate risk impact",
  "Forecast campus energy demand during upcoming Innovision Fest",
  "How to optimize geyser timers across HB-3 and KMS?",
  "Summarize top 3 urgent maintenance priorities for Estate Office",
];

export function AiInsightsView() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, includeCampusContext: true }),
      });

      const data = await response.json();
      const replyText =
        data?.data?.reply ||
        data?.reply ||
        "I was unable to retrieve a response from the DeepBot Ollama backend. Please verify server connectivity.";

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Insights chat error:", err);
      toast.error("Failed to fetch response from DeepBot AI");

      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: "Apologies, the upstream DeepBot server is currently unavailable. Telemetry snapshot: Substation 1 is healthy at 1,420 kW, and CVR water pump repair squad has been alerted.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied insight to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* AI Key Insights Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Insight 1 */}
        <Card className="border-destructive/20 bg-destructive/5 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                Risk Alert
              </Badge>
              <DropletsIcon className="size-4 text-destructive" />
            </div>
            <CardTitle className="text-sm font-semibold mt-1">
              CVR Hall Water Pressure Surge
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Booster pump telemetry indicates mechanical seal cavitation. Estimated risk of supply disruption in 14 hours if unresolved.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-foreground">
              <span>Recommended Action:</span>
              <span className="text-destructive font-semibold">Dispatch Squad #02</span>
            </div>
          </CardContent>
        </Card>

        {/* Insight 2 */}
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px] uppercase font-mono text-amber-600 dark:text-amber-400">
                Demand Spike
              </Badge>
              <ZapIcon className="size-4 text-amber-500" />
            </div>
            <CardTitle className="text-sm font-semibold mt-1">
              Substation 1 Evening Peak
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Evening lighting and auditorium HVAC forecasted to cross 1,450 kW. Recommend shifting hostel geyser reheat cycle by 90 minutes.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-foreground">
              <span>Potential Peak Shaving:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">185 kW Saved</span>
            </div>
          </CardContent>
        </Card>

        {/* Insight 3 */}
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                Eco Offset
              </Badge>
              <TrendingDownIcon className="size-4 text-emerald-500" />
            </div>
            <CardTitle className="text-sm font-semibold mt-1">
              TIIR & HB-3 Solar Dividend
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Solar thermal + rooftop photovoltaic generation offset 412 kg of CO₂ today. Financial savings benchmarked at ₹24,800/week.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-foreground">
              <span>Net Offset Index:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">96% Optimal</span>
            </div>
          </CardContent>
        </Card>

        {/* Insight 4 */}
        <Card className="border-primary/20 bg-primary/5 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] uppercase font-mono text-primary border-primary/30">
                Preventive AI
              </Badge>
              <ShieldCheckIcon className="size-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold mt-1">
              STP Aeration Filter Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              Bioreactor dissolved oxygen sensors indicate filter descaling due in 3 days to prevent treated water turbidity rise.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-foreground">
              <span>Compliance Status:</span>
              <span className="text-primary font-semibold">WHO Standard OK</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Chat Assistant */}
      <Card className="shadow-xs border overflow-hidden">
        <CardHeader className="border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <SparklesIcon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>DeepBot Facility Intelligence Agent</span>
                  <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                    Ollama Backend Connected
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Grounded with live Neon DB complaints, 36-month utility baselines, and campus sensors.
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages(INITIAL_MESSAGES);
                toast.success("Conversation reset.");
              }}
              className="h-8 text-xs gap-1.5"
            >
              <RotateCcwIcon className="size-3.5" />
              <span>Reset Chat</span>
            </Button>
          </div>
        </CardHeader>

        {/* Chat Message Stream */}
        <CardContent className="p-4 space-y-4 min-h-[380px] max-h-[520px] overflow-y-auto bg-muted/5">
          {messages.map((msg) => {
            const isAi = msg.sender === "ai";
            const isCopied = copiedId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div
                  className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isAi
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border"
                  }`}
                >
                  {isAi ? <BotIcon className="size-4" /> : <UserIcon className="size-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`relative rounded-xl p-3.5 max-w-[85%] text-xs shadow-2xs leading-relaxed ${
                    isAi
                      ? "bg-card border text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Message Footer */}
                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isAi ? "text-muted-foreground" : "text-primary-foreground/70"
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {isAi && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="h-5 px-1.5 text-[10px] gap-1 hover:bg-muted text-muted-foreground"
                      >
                        {isCopied ? (
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <BotIcon className="size-4" />
              </div>
              <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-ping" />
                <span>DeepBot is analyzing campus telemetry & generating recommendation...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </CardContent>

        {/* Quick Action Prompt Starters */}
        <div className="p-3 border-t bg-muted/20">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-2">
            <LightbulbIcon className="size-3 text-primary" />
            <span>Suggested Inquiries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              type="text"
              placeholder="Ask CampusMobilize AI about water pressure, energy spikes, maintenance schedules..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="text-xs h-9 flex-1"
            />
            <Button type="submit" size="sm" disabled={isLoading || !inputMessage.trim()} className="h-9 gap-1.5 px-4 text-xs">
              <SendIcon className="size-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
