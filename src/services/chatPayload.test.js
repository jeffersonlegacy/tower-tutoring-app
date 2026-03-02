import { describe, expect, it } from 'vitest';
import { buildChatMessages, normalizeImageInputs } from './chatPayload';

describe('normalizeImageInputs', () => {
  it('keeps string sources and object image fields', () => {
    const result = normalizeImageInputs([
      'https://example.com/a.png',
      { imageUrl: 'https://example.com/b.png' },
      { imageData: 'data:image/png;base64,abc' },
      null,
      {},
    ]);

    expect(result).toEqual([
      'https://example.com/a.png',
      'https://example.com/b.png',
      'data:image/png;base64,abc',
    ]);
  });
});

describe('buildChatMessages', () => {
  it('builds text-only payload', () => {
    const { messages, normalizedImages } = buildChatMessages({
      systemPrompt: 'system',
      prompt: 'hello',
      history: [{ role: 'user', text: 'old' }],
      images: [],
    });

    expect(normalizedImages).toEqual([]);
    expect(messages[0]).toEqual({ role: 'system', content: 'system' });
    expect(messages[messages.length - 1]).toEqual({ role: 'user', content: 'hello' });
  });

  it('builds multimodal user payload when images exist', () => {
    const { messages } = buildChatMessages({
      systemPrompt: 'system',
      prompt: 'check board',
      history: [],
      images: ['https://example.com/whiteboard.png'],
      strokeContext: 'context',
    });

    const userMsg = messages[messages.length - 1];
    expect(userMsg.role).toBe('user');
    expect(Array.isArray(userMsg.content)).toBe(true);
    expect(userMsg.content[0].text).toContain('context');
    expect(userMsg.content[1].image_url.url).toBe('https://example.com/whiteboard.png');
  });
});
