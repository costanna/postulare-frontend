export type EventType = 'interview' | 'follow_up' | 'note' | 'status_change';

export const EVENT_TYPES: EventType[] = ['interview', 'follow_up', 'note', 'status_change'];

export interface ApplicationEvent {
  id: string;
  application_id: string;
  type: EventType;
  description: string | null;
  event_date: string;
}

export interface EventCreatePayload {
  type: EventType;
  description?: string | null;
  event_date?: string;
}
