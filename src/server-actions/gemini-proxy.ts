'use server';

import {askAI} from "@/server-actions/gemini";

export const callGemini = async (prompt: string) => {
    return askAI(prompt);
};