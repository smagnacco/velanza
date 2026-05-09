import type { Context } from 'hono';
import type { SSEEvent } from '@velanza/shared';

export function createSSEStream(
  c: Context,
  handler: (emit: (event: SSEEvent) => void, close: () => void) => Promise<void>
): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  function emit(event: SSEEvent): void {
    const data = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
    writer.write(encoder.encode(data)).catch(() => {});
  }

  function close(): void {
    writer.close().catch(() => {});
  }

  handler(emit, close).catch((err) => {
    emit({ type: 'error', payload: { message: 'Stream error' } });
    close();
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
