"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const AskAIQuestion = () => {
  const [question, setQuestion] = useState("");

  const askAI = async (question: string) => {
    try {
      const session = await window.ai.languageModel.create();
      const response = await session.prompt(question);
      console.log(response);
    } catch (error) {
      console.error("Failed to query local AI model:", error);
    }
  };

  return (
    <div>
      Ask AI Question
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />
      <Button onClick={() => askAI(question)}>Ask</Button>
    </div>
  );
};
