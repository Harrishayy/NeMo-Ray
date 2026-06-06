import { create } from "zustand";

import { getRadioMap } from "@/lib/api/coverage";
import type { AgentRequest } from "@/lib/api/agent";
import { DEFAULT_LAYERS } from "@/lib/layers";
import { computeKpis } from "@/lib/mock/kpis";
import { computeMockRadioMap } from "@/lib/mock/radioMap";
import { MOCK_PROPOSALS } from "@/lib/mock/proposals";
import { DEFAULT_SCENARIO, MOCK_SCENARIOS } from "@/lib/mock/scenarios";
import { MOCK_SITES, MOCK_SITES_BY_ID } from "@/lib/mock/sites";
import type {
  AgentMessage,
  AgentStreamEvent,
  CoverageStatus,
  EventMarker,
  KPI,
  LayerId,
  LayerState,
  Proposal,
  ProposalStatus,
  RadioMap,
  Scenario,
  ScenarioId,
  Site,
  SiteId,
  TimelineMode,
  ToolCall,
  Workspace,
} from "@/lib/types";

// Synchronous first paint — no await, deterministic.
const INITIAL_RADIO_MAP = computeMockRadioMap(DEFAULT_SCENARIO, []);
const INITIAL_KPIS = computeKpis(MOCK_SITES, [], INITIAL_RADIO_MAP);

export interface PanelState {
  left: boolean;
  right: boolean;
  bottom: boolean;
}

interface NemoState {
  // ── scenario ──
  activeScenarioId: ScenarioId;
  scenarios: Record<ScenarioId, Scenario>;
  setScenario(id: ScenarioId): void;

  // ── network ──
  sites: Site[];
  sitesById: Record<SiteId, Site>;
  deactivatedSiteIds: SiteId[];
  selectedSiteId: SiteId | null;
  hoveredSiteId: SiteId | null;
  radioMap: RadioMap | null;
  coverageStatus: CoverageStatus;
  kpis: KPI[];
  proposals: Proposal[];
  selectSite(id: SiteId | null): void;
  hoverSite(id: SiteId | null): void;
  deactivateSite(id: SiteId): void;
  reactivateSite(id: SiteId): void;
  toggleSite(id: SiteId): void;
  recomputeCoverage(): Promise<void>;
  setProposalStatus(id: string, status: ProposalStatus): void;

  // ── layers ──
  layers: Record<LayerId, LayerState>;
  toggleLayer(id: LayerId): void;
  setLayerOpacity(id: LayerId, opacity: number): void;

  // ── timeline ──
  timelineMode: TimelineMode;
  positionMs: number;
  durationMs: number;
  playing: boolean;
  speed: number;
  events: EventMarker[];
  play(): void;
  pause(): void;
  seek(ms: number): void;
  setLive(): void;
  setSpeed(n: number): void;
  tick(dtMs: number): void;

  // ── agent ──
  messages: AgentMessage[];
  toolCalls: ToolCall[];
  streaming: boolean;
  activeMessageId: string | null;
  agentTrigger: { req: AgentRequest; nonce: number } | null;
  addOperatorMessage(text: string): void;
  requestAgentRun(req: AgentRequest): void;
  clearAgentTrigger(): void;
  applyStreamEvent(e: AgentStreamEvent): void;
  resetConversation(): void;

  // ── voice ──
  voiceAvailable: boolean;
  voiceRecording: boolean;
  voiceTranscribing: boolean;
  voiceSpeaking: boolean;
  setVoiceAvailable(v: boolean): void;
  setVoiceRecording(v: boolean): void;
  setVoiceTranscribing(v: boolean): void;
  setVoiceSpeaking(v: boolean): void;

  // ── ui ──
  activeWorkspace: Workspace;
  panels: PanelState;
  mapFocus: boolean;
  setWorkspace(w: Workspace): void;
  togglePanel(side: keyof PanelState): void;
  setPanel(side: keyof PanelState, collapsed: boolean): void;
  setPanels(p: PanelState): void;
  toggleMapFocus(): void;
}

let agentNonce = 0;

export const useNemoStore = create<NemoState>((set, get) => ({
  // ── scenario ──
  activeScenarioId: DEFAULT_SCENARIO,
  scenarios: MOCK_SCENARIOS,
  setScenario: (id) => {
    const scenario = get().scenarios[id];
    const seeded = scenario.seedDeactivated;
    set({
      activeScenarioId: id,
      deactivatedSiteIds: seeded,
      selectedSiteId: null,
      sites: MOCK_SITES.map((s) =>
        seeded.includes(s.id) ? { ...s, status: "deactivated" } : { ...s, status: "active" },
      ),
      events: scenario.events,
      durationMs: scenario.durationMs,
      positionMs: scenario.durationMs,
      timelineMode: "live",
      playing: false,
    });
    void get().recomputeCoverage();
  },

  // ── network ──
  sites: MOCK_SITES.map((s) =>
    MOCK_SCENARIOS[DEFAULT_SCENARIO].seedDeactivated.includes(s.id)
      ? { ...s, status: "deactivated" }
      : s,
  ),
  sitesById: MOCK_SITES_BY_ID,
  deactivatedSiteIds: MOCK_SCENARIOS[DEFAULT_SCENARIO].seedDeactivated,
  selectedSiteId: null,
  hoveredSiteId: null,
  radioMap: INITIAL_RADIO_MAP,
  coverageStatus: "ready",
  kpis: INITIAL_KPIS,
  proposals: MOCK_PROPOSALS,

  selectSite: (id) => set({ selectedSiteId: id }),
  hoverSite: (id) => set({ hoveredSiteId: id }),

  deactivateSite: (id) => {
    const { deactivatedSiteIds, sitesById } = get();
    if (deactivatedSiteIds.includes(id)) return;
    set((st) => ({
      deactivatedSiteIds: [...st.deactivatedSiteIds, id],
      sites: st.sites.map((s) => (s.id === id ? { ...s, status: "deactivated" } : s)),
    }));
    void get().recomputeCoverage();
    const site = sitesById[id];
    get().requestAgentRun({
      trigger: { kind: "site_down", siteId: id, siteName: site?.name ?? id },
    });
  },

  reactivateSite: (id) => {
    set((st) => ({
      deactivatedSiteIds: st.deactivatedSiteIds.filter((x) => x !== id),
      sites: st.sites.map((s) => (s.id === id ? { ...s, status: "active" } : s)),
    }));
    void get().recomputeCoverage();
  },

  toggleSite: (id) =>
    get().deactivatedSiteIds.includes(id)
      ? get().reactivateSite(id)
      : get().deactivateSite(id),

  recomputeCoverage: async () => {
    set({ coverageStatus: "computing" });
    const { activeScenarioId, deactivatedSiteIds, sites } = get();
    try {
      const rm = await getRadioMap(activeScenarioId, deactivatedSiteIds);
      set({
        radioMap: rm,
        coverageStatus: "ready",
        kpis: computeKpis(sites, deactivatedSiteIds, rm),
      });
    } catch {
      set({ coverageStatus: "error" });
    }
  },

  setProposalStatus: (id, status) =>
    set((st) => ({
      proposals: st.proposals.map((p) => (p.id === id ? { ...p, status } : p)),
    })),

  // ── layers ──
  layers: DEFAULT_LAYERS,
  toggleLayer: (id) =>
    set((st) => ({
      layers: { ...st.layers, [id]: { ...st.layers[id], visible: !st.layers[id].visible } },
    })),
  setLayerOpacity: (id, opacity) =>
    set((st) => ({
      layers: { ...st.layers, [id]: { ...st.layers[id], opacity } },
    })),

  // ── timeline ──
  timelineMode: "live",
  positionMs: MOCK_SCENARIOS[DEFAULT_SCENARIO].durationMs,
  durationMs: MOCK_SCENARIOS[DEFAULT_SCENARIO].durationMs,
  playing: false,
  speed: 1,
  events: MOCK_SCENARIOS[DEFAULT_SCENARIO].events,
  play: () => set({ playing: true, timelineMode: "playback" }),
  pause: () => set({ playing: false }),
  seek: (ms) =>
    set((st) => ({
      positionMs: Math.max(0, Math.min(st.durationMs, ms)),
      timelineMode: "playback",
    })),
  setLive: () => set((st) => ({ timelineMode: "live", playing: false, positionMs: st.durationMs })),
  setSpeed: (n) => set({ speed: n }),
  tick: (dtMs) =>
    set((st) => {
      if (!st.playing) return {};
      const next = st.positionMs + dtMs * st.speed;
      if (next >= st.durationMs) return { positionMs: st.durationMs, playing: false, timelineMode: "live" };
      return { positionMs: next };
    }),

  // ── agent ──
  messages: [],
  toolCalls: [],
  streaming: false,
  activeMessageId: null,
  agentTrigger: null,
  addOperatorMessage: (text) =>
    set((st) => ({
      messages: [
        ...st.messages,
        { id: `op-${Date.now()}`, role: "operator", content: text, createdAt: Date.now() },
      ],
    })),
  requestAgentRun: (req) => {
    agentNonce += 1;
    set({ agentTrigger: { req, nonce: agentNonce } });
  },
  clearAgentTrigger: () => set({ agentTrigger: null }),
  applyStreamEvent: (e) =>
    set((st) => {
      switch (e.type) {
        case "message_start":
          return {
            streaming: true,
            activeMessageId: e.id,
            messages: [
              ...st.messages,
              { id: e.id, role: e.role, content: "", streaming: true, createdAt: Date.now() },
            ],
          };
        case "token":
          return {
            messages: st.messages.map((m) =>
              m.id === st.activeMessageId ? { ...m, content: m.content + e.text } : m,
            ),
          };
        case "reasoning":
          return {
            messages: st.messages.map((m) =>
              m.id === st.activeMessageId
                ? { ...m, reasoning: (m.reasoning ?? "") + e.text }
                : m,
            ),
          };
        case "tool_call":
          return {
            toolCalls: [...st.toolCalls, e.call],
            messages: st.messages.map((m) =>
              m.id === st.activeMessageId
                ? { ...m, toolCallIds: [...(m.toolCallIds ?? []), e.call.id] }
                : m,
            ),
          };
        case "tool_update":
          return {
            toolCalls: st.toolCalls.map((t) => (t.id === e.id ? { ...t, ...e.patch } : t)),
          };
        case "message_end":
          return {
            streaming: false,
            activeMessageId: null,
            messages: st.messages.map((m) => (m.id === e.id ? { ...m, streaming: false } : m)),
          };
        case "error":
          return {
            streaming: false,
            activeMessageId: null,
            messages: [
              ...st.messages,
              { id: `err-${Date.now()}`, role: "system", content: e.message, createdAt: Date.now() },
            ],
          };
        default:
          return {};
      }
    }),
  resetConversation: () => set({ messages: [], toolCalls: [], streaming: false, activeMessageId: null }),

  // ── voice ──
  voiceAvailable: false,
  voiceRecording: false,
  voiceTranscribing: false,
  voiceSpeaking: false,
  setVoiceAvailable: (v) => set({ voiceAvailable: v }),
  setVoiceRecording: (v) => set({ voiceRecording: v }),
  setVoiceTranscribing: (v) => set({ voiceTranscribing: v }),
  setVoiceSpeaking: (v) => set({ voiceSpeaking: v }),

  // ── ui ──
  activeWorkspace: "mission",
  panels: { left: false, right: false, bottom: false },
  mapFocus: false,
  setWorkspace: (w) => set({ activeWorkspace: w }),
  togglePanel: (side) =>
    set((st) => ({ panels: { ...st.panels, [side]: !st.panels[side] } })),
  setPanel: (side, collapsed) =>
    set((st) => ({ panels: { ...st.panels, [side]: collapsed } })),
  setPanels: (p) => set({ panels: p }),
  toggleMapFocus: () =>
    set((st) => {
      const next = !st.mapFocus;
      return {
        mapFocus: next,
        panels: next
          ? { left: true, right: true, bottom: true }
          : { left: false, right: false, bottom: false },
      };
    }),
}));

// ── convenience selector hooks ──
export const useKpis = () => useNemoStore((s) => s.kpis);
export const useSites = () => useNemoStore((s) => s.sites);
export const useSelectedSite = () =>
  useNemoStore((s) => (s.selectedSiteId ? s.sitesById[s.selectedSiteId] : null));
export const usePanels = () => useNemoStore((s) => s.panels);
