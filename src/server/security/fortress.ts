/**
 * Fortress Protocol - Express Security Middleware
 * Grey Sky Labs | Flatland Expeditions LLC
 *
 * Bot detection, honeypots, security headers, IP blocking
 */

import { Request, Response, NextFunction } from 'express';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const FORTRESS_CONFIG = {
  honeypots: [
    '/wp-admin',
    '/wp-login.php',
    '/administrator',
    '/.env',
    '/config.php',
    '/.git',
    '/backup.sql',
    '/database.sql',
    '/phpinfo.php',
    '/debug',
  ],
  blockDuration: {
    honeypot: 24 * 60,      // 24 hours
    bot: 60,                // 1 hour
    repeated: 15,           // 15 minutes (progressive)
  },
};

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY STORES
// ═══════════════════════════════════════════════════════════════

interface BlockEntry {
  until: number;
  reason: string;
}

const blockedIPs = new Map<string, BlockEntry>();

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

export function getClientIP(req: Request): string {
  // Cloudflare
  const cfIP = req.headers['cf-connecting-ip'] as string;
  if (cfIP) return cfIP;

  // X-Forwarded-For
  const xff = req.headers['x-forwarded-for'] as string;
  if (xff) return xff.split(',')[0].trim();

  // X-Real-IP
  const xri = req.headers['x-real-ip'] as string;
  if (xri) return xri;

  // Direct
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function isBlocked(ip: string): BlockEntry | null {
  const block = blockedIPs.get(ip);
  if (!block) return null;

  if (block.until < Date.now()) {
    blockedIPs.delete(ip);
    return null;
  }

  return block;
}

export function blockIP(ip: string, minutes: number, reason: string): void {
  blockedIPs.set(ip, {
    until: Date.now() + minutes * 60 * 1000,
    reason,
  });
  console.log(`[SECURITY] Blocked IP: ${ip} for ${minutes}min - ${reason}`);
}

// ═══════════════════════════════════════════════════════════════
// BOT DETECTION
// ═══════════════════════════════════════════════════════════════

export interface BotScore {
  score: number;
  signals: string[];
  isBot: boolean;
}

export function detectBot(req: Request): BotScore {
  const signals: string[] = [];
  let score = 0;

  const ua = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'];
  const acceptEnc = req.headers['accept-encoding'];

  // Missing standard headers
  if (!acceptLang) {
    score += 20;
    signals.push('no_accept_language');
  }
  if (!acceptEnc) {
    score += 15;
    signals.push('no_accept_encoding');
  }

  // Suspicious user agents
  const botPatterns = [
    /python-requests/i,
    /python-urllib/i,
    /curl\//i,
    /wget\//i,
    /scrapy/i,
    /crawl/i,
    /Go-http-client/i,
    /java\//i,
    /Apache-HttpClient/i,
    /libwww-perl/i,
    /mechanize/i,
    /phantom/i,
    /selenium/i,
    /headless/i,
    /puppeteer/i,
    /playwright/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      score += 50;
      signals.push('bot_user_agent');
      break;
    }
  }

  // Short or empty user agent
  if (ua.length < 30) {
    score += 25;
    signals.push('short_user_agent');
  }

  return {
    score,
    signals,
    isBot: score >= 50,
  };
}

// ═══════════════════════════════════════════════════════════════
// HONEYPOT CHECK
// ═══════════════════════════════════════════════════════════════

export function isHoneypot(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return FORTRESS_CONFIG.honeypots.some((hp) => lowerPath.includes(hp.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════
// SECURITY HEADERS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // CSP for API
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove revealing headers
  res.removeHeader('X-Powered-By');

  next();
}

// ═══════════════════════════════════════════════════════════════
// FORTRESS MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function fortress(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIP(req);
  const path = req.path;

  // 1. Check if IP is blocked
  const block = isBlocked(ip);
  if (block) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // 2. Check honeypot
  if (isHoneypot(path)) {
    blockIP(ip, FORTRESS_CONFIG.blockDuration.honeypot, 'honeypot');
    console.log(`[SECURITY] Honeypot triggered: ${ip} -> ${path}`);

    // Waste attacker's time
    setTimeout(() => {
      res.status(404).send('Not found');
    }, 5000);
    return;
  }

  // 3. Bot detection (skip for API routes with auth - those have tokens)
  if (!req.headers.authorization) {
    const bot = detectBot(req);
    if (bot.isBot) {
      console.log(`[SECURITY] Bot blocked: ${ip}, score: ${bot.score}, signals: ${bot.signals.join(', ')}`);
      blockIP(ip, FORTRESS_CONFIG.blockDuration.bot, 'bot_detected');
      res.status(403).json({ error: 'Access denied' });
      return;
    }
  }

  next();
}

// ═══════════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIP(req);
  const ua = req.headers['user-agent'] || 'unknown';

  // Log suspicious requests
  if (req.path.includes('..') || req.path.includes('%00') || req.path.includes('\\')) {
    console.log(`[SECURITY] Suspicious path: ${ip} -> ${req.path}`);
    blockIP(ip, 60, 'suspicious_path');
    res.status(400).json({ error: 'Bad request' });
    return;
  }

  next();
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export default {
  fortress,
  securityHeaders,
  securityLogger,
  getClientIP,
  isBlocked,
  blockIP,
  detectBot,
  isHoneypot,
};
