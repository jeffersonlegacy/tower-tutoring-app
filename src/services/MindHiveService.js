/**
 * MindHiveService.js
 *
 * Gemini-backed tutoring stream service.
 * All model access is routed through /api/chat/completions.
 */
import { composeSystemPrompt } from './MindHivePlugins';
import { buildChatMessages } from './chatPayload';
import { trackError } from './telemetry';

const CONFIG = {
  model: import.meta.env.VITE_GEMINI_MODEL || import.meta.env.VITE_OPENAI_MODEL || 'gemini-1.5-flash',
  temperature: 0.75,
  endpoint: '/api/chat/completions',
  systemPrompt: composeSystemPrompt({ ageGroup: 'high', enableLiveTutor: false }),
};

class MindHiveService {
  async streamResponse(
    prompt,
    history = [],
    onChunk,
    onModelChange,
    images = [],
    strokeContext = '',
  ) {
    if (onModelChange) {
      onModelChange(`GEMINI ${CONFIG.model.toUpperCase()}`);
    }

    const { messages } = buildChatMessages({
      systemPrompt: CONFIG.systemPrompt,
      prompt,
      history,
      images,
      strokeContext,
    });

    const response = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONFIG.model,
        messages,
        temperature: CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat proxy failed (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let hasContent = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json?.choices?.[0]?.delta?.content ?? '';
          if (content) {
            hasContent = true;
            onChunk(content);
          }
        } catch {
          // ignore malformed partial SSE lines
        }
      }
    }

    if (!hasContent) throw new Error('Empty response from Gemini API');
  }

  async streamResponseSafe(...args) {
    try {
      await this.streamResponse(...args);
      return { ok: true, error: null };
    } catch (error) {
      trackError('mindhive.streamResponse', error);
      return { ok: false, error };
    }
  }
}

let instance = null;
export function getMindHive() {
  if (!instance) {
    instance = new MindHiveService();
  }
  return instance;
}

/**
 * Parse AI response - handles both JSON and plain text
 */
export function parseAIResponse(rawText) {
  if (!rawText) return { isStructured: false, textDisplay: '' };

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;

  if (!jsonStr) {
    const firstParen = rawText.indexOf('{');
    const lastParen = rawText.lastIndexOf('}');
    if (firstParen !== -1 && lastParen !== -1 && lastParen > firstParen) {
      jsonStr = rawText.substring(firstParen, lastParen + 1);
    }
  }

  if (jsonStr) {
    const trimmed = jsonStr.trim();
    const isPotentialJson = trimmed.startsWith('{');
    const isCompleteJson = trimmed.endsWith('}');

    if (isPotentialJson && !isCompleteJson) {
      return {
        isStructured: true,
        isPartial: true,
        voiceResponse: '',
        textDisplay: 'AI is formulating visual strategies...',
        emotionalState: 'curious',
      };
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        isStructured: true,
        voiceResponse: parsed.voice_response || parsed.text_display || rawText,
        textDisplay: parsed.text_display || parsed.voice_response || rawText,
        whiteboardAction: parsed.whiteboard_action || null,
        emotionalState: parsed.emotional_state || 'neutral',
        cognitiveLoad: parsed.cognitive_load || 'medium',
        nextStep: parsed.next_step || null,
        safetyFlag: parsed.safety_flag || false,
      };
    } catch {
      // fall through to plain text
    }
  }

  return {
    isStructured: false,
    voiceResponse: rawText,
    textDisplay: rawText,
    whiteboardAction: null,
    emotionalState: 'neutral',
    cognitiveLoad: 'medium',
    nextStep: null,
    safetyFlag: false,
  };
}
