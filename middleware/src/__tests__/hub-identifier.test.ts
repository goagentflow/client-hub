import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHubFindFirst = vi.fn();
const mockHubFindMany = vi.fn();

vi.mock('../db/prisma.js', () => ({
  getPrisma: () => ({
    hub: {
      findFirst: (...args: unknown[]) => mockHubFindFirst(...args),
      findMany: (...args: unknown[]) => mockHubFindMany(...args),
    },
  }),
}));

import { normalizeHubIdentifier, resolveHubId } from '../db/hub-identifier.js';

describe('hub-identifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes legacy slug input consistently', () => {
    expect(normalizeHubIdentifier(' Curious Health ')).toBe('curioushealth');
    expect(normalizeHubIdentifier('Curious-Health!')).toBe('curioushealth');
  });

  it('returns exact hub ID when identifier already matches id', async () => {
    mockHubFindFirst.mockResolvedValueOnce({ id: 'hub-123' });

    const resolved = await resolveHubId('hub-123');

    expect(resolved).toBe('hub-123');
    expect(mockHubFindFirst).toHaveBeenCalledTimes(1);
    expect(mockHubFindMany).not.toHaveBeenCalled();
  });

  it('resolves unique legacy slug to canonical id', async () => {
    mockHubFindFirst.mockResolvedValueOnce(null);
    mockHubFindMany.mockResolvedValueOnce([
      { id: 'hub-abc', companyName: 'Curious Health' },
      { id: 'hub-def', companyName: 'Another Co' },
    ]);

    const resolved = await resolveHubId('curioushealth', { publishedOnly: true });

    expect(resolved).toBe('hub-abc');
  });

  it('returns null when legacy slug is ambiguous', async () => {
    mockHubFindFirst.mockResolvedValueOnce(null);
    mockHubFindMany.mockResolvedValueOnce([
      { id: 'hub-1', companyName: 'Curious Health' },
      { id: 'hub-2', companyName: 'Curious-Health' },
    ]);

    const resolved = await resolveHubId('curioushealth', { publishedOnly: true });

    expect(resolved).toBeNull();
  });
});
