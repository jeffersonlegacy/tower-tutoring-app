export function normalizeImageInputs(images = []) {
  return images
    .map((img) => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object') return img.imageUrl || img.imageData || '';
      return '';
    })
    .filter(Boolean);
}

export function buildChatMessages({ systemPrompt, prompt, history = [], images = [], strokeContext = '' }) {
  const enrichedPrompt = strokeContext ? `${strokeContext}\n\nUser Message: ${prompt}` : prompt;
  const messages = [{ role: 'system', content: systemPrompt }];

  let historyStarted = false;
  for (const msg of history.slice(0, -1)) {
    const role = msg.role === 'model' ? 'assistant' : 'user';
    if (!historyStarted && role === 'assistant') continue;
    historyStarted = true;
    const text = typeof msg.text === 'string' ? msg.text : '';
    if (!text) continue;
    messages.push({ role, content: text });
  }

  const normalizedImages = normalizeImageInputs(images);
  if (normalizedImages.length > 0) {
    const userContent = [{ type: 'text', text: enrichedPrompt }];
    for (const src of normalizedImages) {
      userContent.push({ type: 'image_url', image_url: { url: src } });
    }
    messages.push({ role: 'user', content: userContent });
  } else {
    messages.push({ role: 'user', content: enrichedPrompt });
  }

  return { messages, normalizedImages };
}
