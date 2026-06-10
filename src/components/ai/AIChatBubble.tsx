"use client";

import { Bot, User } from "lucide-react";
import type { ChatMsg } from "@/lib/ai/client";

export function AIChatBubble({ role, content }: ChatMsg) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-sonar/20 text-sonar" : "bg-white/10 text-mist"}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-sonar/20 text-foam"
            : "rounded-tl-sm bg-white/5 text-foam/90"
        } ${!content ? "animate-pulse opacity-50" : ""}`}
      >
        {content || "…"}
      </div>
    </div>
  );
}
