import {describe, expect, it} from 'vitest';
import {EARLIER_SCREENSHOT_NOTE, MAX_IMAGE_BYTES, checkChatAttachments, historyText, trimHistoryImages} from '@/lib/jaren/attachments';

const png = (bytes = 30) => `data:image/png;base64,${Buffer.alloc(bytes, 1).toString('base64')}`;
const file = (url = png(), mediaType = 'image/png') => ({type: 'file', mediaType, url});
const user = (...parts: object[]) => ({role: 'user', parts: [{type: 'text', text: 'see this'}, ...parts]});

describe('Jaren screenshot checks', () => {
  it('allows text-only chats and screenshots on user messages', () => {
    expect(checkChatAttachments([{role: 'user', parts: [{type: 'text', text: 'hi'}]}])).toBeNull();
    expect(checkChatAttachments([user(file(), file(png(10), 'image/png'))])).toBeNull();
  });
  it('refuses remote URLs, mismatched or non-image types', () => {
    expect(checkChatAttachments([user(file('https://example.com/a.png'))])).toMatch(/PNG, JPEG/);
    expect(checkChatAttachments([user(file(png(), 'image/jpeg'))])).toMatch(/PNG, JPEG/);
    expect(checkChatAttachments([user(file('data:application/pdf;base64,AAAA', 'application/pdf'))])).toMatch(/PNG, JPEG/);
    expect(checkChatAttachments([user(file('data:image/svg+xml;base64,AAAA', 'image/svg+xml'))])).toMatch(/PNG, JPEG/);
  });
  it('refuses screenshots on assistant messages, too many, or too large', () => {
    expect(checkChatAttachments([{role: 'assistant', parts: [file()]}])).toMatch(/your own messages/);
    expect(checkChatAttachments([user(file(), file(), file(), file(), file())])).toMatch(/up to 4/);
    expect(checkChatAttachments([user(file(png(MAX_IMAGE_BYTES + 3)))])).toMatch(/too large/);
    expect(checkChatAttachments([user(file(png(MAX_IMAGE_BYTES)))])).toBeNull();
  });
});

describe('trimming older screenshots', () => {
  it('keeps the newest screenshots and notes the dropped ones', () => {
    const a = file(png(300)), b = file(png(300));
    const messages = [user(a), {role: 'assistant', parts: [{type: 'text', text: 'ok'}]}, user(b)];
    const out = trimHistoryImages(messages as never, b.url.length + 10) as typeof messages;
    expect(out[2]!.parts).toContainEqual(b);
    expect(out[0]!.parts).not.toContainEqual(a);
    expect(out[0]!.parts).toContainEqual({type: 'text', text: EARLIER_SCREENSHOT_NOTE});
    expect(messages[0]!.parts).toContainEqual(a); // input left untouched
  });
  it('leaves everything when within budget', () => {
    const messages = [user(file()), user(file())];
    expect(trimHistoryImages(messages as never)).toEqual(messages);
  });
});

describe('saved history text', () => {
  it('notes screenshots without storing them', () => {
    expect(historyText('hi', 0)).toBe('hi');
    expect(historyText('hi', 1)).toBe('hi\n\n[1 screenshot attached]');
    expect(historyText('', 2)).toBe('[2 screenshots attached]');
  });
});
