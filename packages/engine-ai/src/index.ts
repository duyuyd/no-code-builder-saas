/** Explicitly describe AI availability. Do not fabricate an offline agent. */
export type AiConnection = { connected: true; provider: string; model: string } |
  { connected: false; reason: "disabled" | "missing-credentials" | "unavailable" };
export type LogicProposal = {
  schemaVersion: 1;
  prompt: string;
  status: "proposed" | "approved" | "rejected";
  behavior: { states: string[]; transitions: Array<{ from: string; to: string; event: string }> };
};
export function requiresUserApproval(proposal: LogicProposal): boolean {
  return proposal.status !== "approved";
}
