// Use Web Crypto API if available (for edge runtime), otherwise Node.js crypto
const webCrypto = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null;

// Get Node.js crypto dynamically to avoid import issues in edge runtime
let nodeCrypto: any = null;
const getNodeCrypto = async () => {
  if (!nodeCrypto) {
    try {
      const cryptoModule = await import('crypto');
      nodeCrypto = cryptoModule.default;
    } catch (error) {
      // If Node.js crypto is not available, we'll need to handle this differently
      console.error('Node.js crypto not available:', error);
      throw new Error('Crypto functionality not available in this environment');
    }
  }
  return nodeCrypto;
};

// Simple password hashing (for demo purposes - in production use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const crypto = await getNodeCrypto();
  if (!crypto) {
    throw new Error('Crypto not available');
  }
  return crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

// Simple JWT-like token generation
export async function generateToken(userId: string, email: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
    })
  );

  if (webCrypto) {
    // Use Web Crypto API for edge runtime
    const key = await webCrypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await webCrypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${header}.${payload}.${signatureHex}`;
  } else {
    // Use Node.js crypto
    const crypto = await getNodeCrypto();
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
      .update(`${header}.${payload}`)
      .digest('hex');
    return `${header}.${payload}.${signature}`;
  }
}

// Simple JWT-like token verification
export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  iat: number;
} | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;

    if (webCrypto) {
      // Use Web Crypto API for edge runtime
      const key = await webCrypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );
      const isValid = await webCrypto.subtle.verify(
        'HMAC',
        key,
        new Uint8Array(signature.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []),
        new TextEncoder().encode(`${header}.${payload}`)
      );
      if (!isValid) return null;
    } else {
      // Use Node.js crypto
      const crypto = await getNodeCrypto();
      const expectedSignature = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'your-secret-key')
        .update(`${header}.${payload}`)
        .digest('hex');
      if (signature !== expectedSignature) return null;
    }

    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
