'use client';

export type ProposalCameraEvent =
  | { type: 'accepted'; proposal: { lat: number; lng: number } }
  | { type: 'rejected'; proposal: { lat: number; lng: number } }
  | { type: 'overview' };

type Listener = (event: ProposalCameraEvent) => void;

class ProposalEventBus {
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  emit(event: ProposalCameraEvent): void {
    this.listeners.forEach(fn => fn(event));
  }
}

export const proposalEventBus = new ProposalEventBus();
