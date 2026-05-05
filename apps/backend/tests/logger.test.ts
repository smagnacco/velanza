import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { logger } from '../src/lib/logger.js';

describe('logger', () => {
  it('does not throw for standard messages', () => {
    expect(() => logger.info('test message')).not.toThrow();
    expect(() => logger.error('error message')).not.toThrow();
    expect(() => logger.warn('warn message')).not.toThrow();
  });

  it('redacts Anthropic API keys from log output', () => {
    const spy = spyOn(console, 'log').mockImplementation(() => {});
    logger.info('key is sk-ant-api03-supersecretvalue1234567890abcdef');
    const call = spy.mock.calls[0]?.[0] ?? '';
    expect(call).toContain('[REDACTED]');
    expect(call).not.toContain('sk-ant-api03');
    spy.mockRestore();
  });

  it('redacts OpenAI-style API keys from log output', () => {
    const spy = spyOn(console, 'log').mockImplementation(() => {});
    logger.info('key is sk-supersecretvalue1234567890abcdefghijklm');
    const call = spy.mock.calls[0]?.[0] ?? '';
    expect(call).toContain('[REDACTED]');
    expect(call).not.toContain('sk-supersecret');
    spy.mockRestore();
  });

  it('does not redact normal text', () => {
    const spy = spyOn(console, 'log').mockImplementation(() => {});
    logger.info('hello world');
    const call = spy.mock.calls[0]?.[0] ?? '';
    expect(call).toContain('hello world');
    expect(call).not.toContain('[REDACTED]');
    spy.mockRestore();
  });
});
