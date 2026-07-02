import { toAbsoluteUploadUrl } from './upload-url';

describe('toAbsoluteUploadUrl', () => {
  it('devuelve null para null/undefined/empty', () => {
    expect(toAbsoluteUploadUrl(null)).toBeNull();
    expect(toAbsoluteUploadUrl(undefined)).toBeNull();
    expect(toAbsoluteUploadUrl('')).toBeNull();
  });

  it('pasa absoluto http:// tal cual', () => {
    expect(toAbsoluteUploadUrl('http://localhost:3000/uploads/x.png')).toBe(
      'http://localhost:3000/uploads/x.png',
    );
    expect(toAbsoluteUploadUrl('https://cdn.example.com/x.jpg')).toBe(
      'https://cdn.example.com/x.jpg',
    );
  });

  it('pasa data: y blob: tal cual', () => {
    expect(toAbsoluteUploadUrl('data:image/png;base64,AAAA')).toBe(
      'data:image/png;base64,AAAA',
    );
    expect(toAbsoluteUploadUrl('blob:http://localhost/abc-123')).toBe(
      'blob:http://localhost/abc-123',
    );
  });

  it('prepende el origen a URL relativa /uploads/', () => {
    expect(toAbsoluteUploadUrl('/uploads/2026-07/abc.png')).toBe(
      'http://localhost:3000/uploads/2026-07/abc.png',
    );
  });

  it('prepende el origen a cualquier path relativo (no solo /uploads/)', () => {
    // The function is conservative: it only short-circuits on URLs that
    // already have a protocol. Any relative path gets the origin prepended.
    // This is intentional — it avoids leaking implementation details
    // (which paths are "ours" vs the backend's) into the helper.
    expect(toAbsoluteUploadUrl('/assets/logo.svg')).toBe(
      'http://localhost:3000/assets/logo.svg',
    );
  });
});
