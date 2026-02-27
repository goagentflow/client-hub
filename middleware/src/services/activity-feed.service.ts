/**
 * Activity feed mapping service.
 *
 * Converts raw hub events into staff-facing activity feed items with
 * human-readable titles and descriptions.
 */

type ActivityType = 'view' | 'download' | 'upload' | 'comment' | 'message' | 'meeting' | 'invite' | 'join';

interface HubEventLike {
  id: string;
  hubId: string | null;
  eventType: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
  metadata: unknown;
}

interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  actor: {
    name: string;
    email: string;
    avatarUrl: null;
  } | null;
  resourceLink: string | null;
}

function getActorName(event: HubEventLike): string {
  const name = event.userName?.trim();
  if (name) return name;
  const email = event.userEmail?.trim();
  if (email) return email;
  return 'A user';
}

function toMetadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function parseSectionName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^portal-/, '');
  const labels: Record<string, string> = {
    overview: 'the overview',
    proposal: 'the proposal',
    videos: 'videos',
    documents: 'documents',
    messages: 'messages',
    meetings: 'meetings',
    questionnaire: 'the questionnaire',
    people: 'people',
    'client-portal': 'client access',
  };
  if (labels[normalized]) return labels[normalized];
  return `the ${normalized.replace(/[_-]+/g, ' ')}`;
}

function toEventTitle(eventType: string): string {
  const labels: Record<string, string> = {
    'hub.viewed': 'Hub viewed',
    'proposal.viewed': 'Proposal viewed',
    'proposal.slide_time': 'Proposal engagement',
    'video.watched': 'Video watched',
    'video.completed': 'Video completed',
    'document.viewed': 'Document viewed',
    'document.downloaded': 'Document downloaded',
    'meeting.joined': 'Meeting joined',
    'message.sent': 'Message sent',
    'message.read': 'Message read',
    'questionnaire.started': 'Questionnaire started',
    'questionnaire.completed': 'Questionnaire completed',
    'share.sent': 'Invite sent',
    'share.accepted': 'Invite accepted',
  };
  if (labels[eventType]) return labels[eventType];
  return eventType
    .replace(/[._]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toResourceLink(hubId: string | null, eventType: string, metadata: Record<string, unknown>): string | null {
  if (!hubId) return null;

  if (eventType === 'hub.viewed') {
    const section = parseSectionName(metadata.section);
    if (section === 'the overview') return `/hub/${hubId}/overview`;
    if (section === 'the proposal') return `/hub/${hubId}/proposal`;
    if (section === 'videos') return `/hub/${hubId}/videos`;
    if (section === 'documents') return `/hub/${hubId}/documents`;
    if (section === 'messages') return `/hub/${hubId}/messages`;
    if (section === 'meetings') return `/hub/${hubId}/meetings`;
    if (section === 'the questionnaire') return `/hub/${hubId}/questionnaire`;
  }

  if (eventType.startsWith('proposal.')) return `/hub/${hubId}/proposal`;
  if (eventType.startsWith('video.')) return `/hub/${hubId}/videos`;
  if (eventType.startsWith('document.')) return `/hub/${hubId}/documents`;
  if (eventType.startsWith('meeting.')) return `/hub/${hubId}/meetings`;
  if (eventType.startsWith('message.')) return `/hub/${hubId}/messages`;
  if (eventType.startsWith('questionnaire.')) return `/hub/${hubId}/questionnaire`;
  if (eventType.startsWith('share.')) return `/hub/${hubId}/client-portal`;

  return `/hub/${hubId}/overview`;
}

function toActivityDetails(eventType: string, metadata: Record<string, unknown>, actorName: string): {
  type: ActivityType;
  title: string;
  description: string;
} {
  if (eventType === 'hub.viewed') {
    const section = parseSectionName(metadata.section);
    return {
      type: 'view',
      title: 'Hub viewed',
      description: section
        ? `${actorName} viewed ${section}.`
        : `${actorName} opened the hub.`,
    };
  }

  if (eventType === 'proposal.viewed') {
    const slideNum = toPositiveNumber(metadata.slideNum);
    return {
      type: 'view',
      title: 'Proposal viewed',
      description: slideNum
        ? `${actorName} viewed the proposal (slide ${slideNum}).`
        : `${actorName} viewed the proposal.`,
    };
  }

  if (eventType === 'proposal.slide_time') {
    const slideNum = toPositiveNumber(metadata.slideNum);
    const seconds = toPositiveNumber(metadata.seconds);
    return {
      type: 'view',
      title: 'Proposal engagement',
      description: seconds && slideNum
        ? `${actorName} spent ${Math.round(seconds)}s on proposal slide ${slideNum}.`
        : `${actorName} engaged with the proposal.`,
    };
  }

  if (eventType === 'video.watched') {
    const percent = toPositiveNumber(metadata.percentComplete);
    return {
      type: 'view',
      title: 'Video watched',
      description: percent
        ? `${actorName} watched a video (${Math.round(percent)}% complete).`
        : `${actorName} watched a video.`,
    };
  }

  if (eventType === 'video.completed') {
    return {
      type: 'view',
      title: 'Video completed',
      description: `${actorName} completed a video.`,
    };
  }

  if (eventType === 'document.viewed') {
    return {
      type: 'view',
      title: 'Document viewed',
      description: `${actorName} viewed a document.`,
    };
  }

  if (eventType === 'document.downloaded') {
    return {
      type: 'download',
      title: 'Document downloaded',
      description: `${actorName} downloaded a document.`,
    };
  }

  if (eventType === 'meeting.joined') {
    return {
      type: 'meeting',
      title: 'Meeting joined',
      description: `${actorName} joined a meeting.`,
    };
  }

  if (eventType === 'message.sent') {
    return {
      type: 'message',
      title: 'Message sent',
      description: `${actorName} sent a message.`,
    };
  }

  if (eventType === 'message.read') {
    return {
      type: 'message',
      title: 'Message read',
      description: `${actorName} read a message.`,
    };
  }

  if (eventType === 'questionnaire.started') {
    return {
      type: 'view',
      title: 'Questionnaire started',
      description: `${actorName} started the questionnaire.`,
    };
  }

  if (eventType === 'questionnaire.completed') {
    return {
      type: 'join',
      title: 'Questionnaire completed',
      description: `${actorName} completed the questionnaire.`,
    };
  }

  if (eventType === 'share.sent') {
    const recipientEmail = typeof metadata.recipientEmail === 'string' ? metadata.recipientEmail.trim() : '';
    return {
      type: 'invite',
      title: 'Invite sent',
      description: recipientEmail
        ? `${actorName} sent an invite to ${recipientEmail}.`
        : `${actorName} sent an invite.`,
    };
  }

  if (eventType === 'share.accepted') {
    return {
      type: 'join',
      title: 'Invite accepted',
      description: `${actorName} accepted an invite.`,
    };
  }

  const title = toEventTitle(eventType);
  return {
    type: 'view',
    title,
    description: `${actorName} triggered ${title.toLowerCase()}.`,
  };
}

export function mapHubEventToActivityFeedItem(event: HubEventLike): ActivityFeedItem {
  const metadata = toMetadataObject(event.metadata);
  const actorName = getActorName(event);
  const details = toActivityDetails(event.eventType, metadata, actorName);

  return {
    id: event.id,
    type: details.type,
    title: details.title,
    description: details.description,
    timestamp: event.createdAt,
    actor: event.userName || event.userEmail
      ? {
          name: event.userName || event.userEmail || 'Unknown user',
          email: event.userEmail || '',
          avatarUrl: null,
        }
      : null,
    resourceLink: toResourceLink(event.hubId, event.eventType, metadata),
  };
}
