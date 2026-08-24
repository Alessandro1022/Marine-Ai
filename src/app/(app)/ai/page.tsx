"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export default function AIPage() {
  const [input, setInput] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-mist">MARIVIO AI</h1>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Fråga något..."
          className="flex-1 bg-white/5 border border-sonar/20 rounded-full px-4 py-3 text-mist"
        />
        <button className="p-3 bg-sonar/25 rounded-full">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
