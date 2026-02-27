import { describe, it, expect } from 'vitest';
import { mapHubEventToActivityFeedItem } from '../services/activity-feed.service.js';

describe('activity-feed.service', () => {
  it('maps hub.viewed events to readable feed text with actor + section', () => {
    const item = mapHubEventToActivityFeedItem({
      id: 'evt-1',
      hubId: 'hub-1',
      eventType: 'hub.viewed',
      userName: 'Alex Torres',
      userEmail: 'alex@client.com',
      createdAt: new Date('2026-02-27T10:00:00.000Z'),
      metadata: { section: 'portal-overview' },
    });

    expect(item.title).toBe('Hub viewed');
    expect(item.description).toContain('Alex Torres');
    expect(item.description).toContain('overview');
    expect(item.resourceLink).toBe('/hub/hub-1/overview');
    expect(item.actor?.email).toBe('alex@client.com');
  });

  it('maps document.downloaded to download type', () => {
    const item = mapHubEventToActivityFeedItem({
      id: 'evt-2',
      hubId: 'hub-1',
      eventType: 'document.downloaded',
      userName: 'Alex Torres',
      userEmail: 'alex@client.com',
      createdAt: new Date('2026-02-27T10:00:00.000Z'),
      metadata: { documentId: 'doc-1' },
    });

    expect(item.type).toBe('download');
    expect(item.title).toBe('Document downloaded');
    expect(item.description).toContain('downloaded a document');
    expect(item.resourceLink).toBe('/hub/hub-1/documents');
  });

  it('maps portal.login to client login details', () => {
    const item = mapHubEventToActivityFeedItem({
      id: 'evt-4',
      hubId: 'hub-1',
      eventType: 'portal.login',
      userName: 'Alex Torres',
      userEmail: 'alex@client.com',
      createdAt: new Date('2026-02-27T10:00:00.000Z'),
      metadata: { method: 'code' },
    });

    expect(item.type).toBe('join');
    expect(item.title).toBe('Client login');
    expect(item.description).toContain('logged into the client hub');
    expect(item.resourceLink).toBe('/hub/hub-1/overview');
  });

  it('falls back gracefully for unknown events', () => {
    const item = mapHubEventToActivityFeedItem({
      id: 'evt-3',
      hubId: 'hub-1',
      eventType: 'custom.event_type',
      userName: null,
      userEmail: null,
      createdAt: new Date('2026-02-27T10:00:00.000Z'),
      metadata: null,
    });

    expect(item.title).toBe('Custom Event Type');
    expect(item.description).toContain('A user');
    expect(item.actor).toBeNull();
    expect(item.resourceLink).toBe('/hub/hub-1/overview');
  });
});
