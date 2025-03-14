"use client";
import { callGemini } from "@/server-actions/gemini-proxy";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const AskAIQuestion = () => {
  const [question, setQuestion] = useState("");

  const askAI = async (question: string) => {
    const response = await callGemini(question);

    console.log(response);
  };

  return (
    <div>
      Ask AI Question
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      <Button onClick={() => askAI(question)}>Ask</Button>
    </div>
  );
};
