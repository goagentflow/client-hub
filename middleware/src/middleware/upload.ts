/**
 * Multer upload middleware for document file uploads.
 *
 * Memory storage (buffer in RAM) — safe within Cloud Run 1Gi + 50 MB limit.
 * MIME allowlist enforced at middleware level.
 */

import multer from 'multer';
import type { RequestHandler } from 'express';
import { Errors } from './error-handler.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Extension-to-MIME mapping for validation. */
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.pdf':  ['application/pdf'],
  '.doc':  ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls':  ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.ppt':  ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.csv':  ['text/csv'],
  '.txt':  ['text/plain'],
  '.jpg':  ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png':  ['image/png'],
  '.gif':  ['image/gif'],
  '.webp': ['image/webp'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const uploadMiddleware: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(Errors.badRequest(`File type ${file.mimetype} is not allowed`));
    }

    // Validate extension matches MIME type
    const ext = (file.originalname.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    if (!ext) {
      return cb(Errors.badRequest('File extension is required'));
    }

    const allowedMimes = EXTENSION_MIME_MAP[ext];
    if (!allowedMimes) {
      return cb(Errors.badRequest(`File extension ${ext} is not allowed`));
    }

    if (allowedMimes && !allowedMimes.includes(file.mimetype)) {
      return cb(Errors.badRequest(`File extension ${ext} does not match MIME type ${file.mimetype}`));
    }

    cb(null, true);
  },
}).single('file');
