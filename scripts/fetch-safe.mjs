const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;

async function readLimitedBody(response, maxBytes, controller) {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    controller.abort();
    throw new Error(`Response te groot: ${declaredLength} bytes (max ${maxBytes})`);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      controller.abort();
      throw new Error(`Response overschrijdt ${maxBytes} bytes`);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchResource(url, options = {}, {
  label = url,
  expectedContentTypes = [],
  maxBytes = DEFAULT_MAX_BYTES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label}: timeout na ${timeoutMs} ms`)), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (expectedContentTypes.length && contentType && !expectedContentTypes.some((type) => contentType.includes(type))) {
      throw new Error(`${label}: onverwacht content-type ${contentType}`);
    }
    const text = await readLimitedBody(response, maxBytes, controller);
    if (!response.ok) {
      const error = new Error(`${label} ${response.status}: ${text.slice(0, 180)}`);
      error.status = response.status;
      throw error;
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJsonResource(url, options = {}, settings = {}) {
  const text = await fetchResource(url, options, {
    ...settings,
    expectedContentTypes: settings.expectedContentTypes ?? ['application/json', 'text/json'],
  });
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${settings.label ?? url}: ongeldige JSON (${error.message})`);
  }
}

export function fetchTextResource(url, options = {}, settings = {}) {
  return fetchResource(url, options, {
    ...settings,
    expectedContentTypes: settings.expectedContentTypes ?? ['text/html'],
  });
}
