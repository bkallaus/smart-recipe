import { describe, expect, test, vi } from 'vitest';
import { smartIngest } from '../ingest-helper';
import { askAI } from '@/server-actions/gemini';

vi.mock('@/server-actions/gemini', () => ({
  askAI: vi.fn().mockResolvedValue('{}'),
}));

describe('smartIngest', () => {
  test('should construct prompt correctly for HTML string', async () => {
    const html = '<html><body><h1>Recipe</h1></body></html>';
    await smartIngest(html);

    expect(askAI).toHaveBeenCalledWith(expect.stringContaining('HTML website content'));
    expect(askAI).toHaveBeenCalledWith(expect.stringContaining(html));
  });

  test('should construct prompt correctly for JSON object', async () => {
    const json = { name: 'Recipe' };
    await smartIngest(json);

    expect(askAI).toHaveBeenCalledWith(expect.stringContaining('jsonld recipe data'));
    expect(askAI).toHaveBeenCalledWith(expect.stringContaining('"name":"Recipe"'));
  });
});
