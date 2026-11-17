export type NpcAction = "idle" | "patrol" | "attack" | "retreat";
export type NpcEvent = "enemy_seen" | "enemy_lost" | "patrol_done" | "low_health" | "recover";
export interface NpcBehavior {
 schemaVersion:1;
 initialState:string;
 states:{id:string;action:NpcAction}[];
 transitions:{from:string;to:string;event:NpcEvent}[];
}
const actions=new Set<NpcAction>(["idle","patrol","attack","retreat"]);
const events=new Set<NpcEvent>(["enemy_seen","enemy_lost","patrol_done","low_health","recover"]);
const identifier=/^[a-z][a-z0-9_]{0,39}$/;
export function validateNpcBehavior(raw:unknown):raw is NpcBehavior{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const b=raw as Partial<NpcBehavior>;
 if(b.schemaVersion!==1||typeof b.initialState!=="string"||
  !Array.isArray(b.states)||b.states.length<1||b.states.length>16||
  !Array.isArray(b.transitions)||b.transitions.length>64)return false;
 const ids=new Set<string>();
 for(const s of b.states){
  if(!s||!identifier.test(s.id)||ids.has(s.id)||!actions.has(s.action))return false;
  ids.add(s.id);
 }
 if(!ids.has(b.initialState))return false;
 return b.transitions.every(t=>t&&ids.has(t.from)&&ids.has(t.to)&&events.has(t.event));
}
export function compileNpcBehavior(b:NpcBehavior):string{
 if(!validateNpcBehavior(b))throw new TypeError("Invalid NPC behavior graph");
 const source=JSON.stringify(b);
 // No model-provided JavaScript is executed. The generated state machine is deterministic.
 return [
  "/* NPC state machine — generated from a validated behavior graph. */",
  "const graph = "+source+";",
  "export function createNpc() { return { state: graph.initialState }; }",
  "export function stepNpc(npc, event) {",
  "  const transition = graph.transitions.find(t => t.from === npc.state && t.event === event);",
  "  const nextState = transition ? transition.to : npc.state;",
  "  const state = graph.states.find(s => s.id === nextState);",
  "  return { state: nextState, action: state?.action ?? 'idle' };",
  "}",
  "export const behaviorGraph = graph;",
  ""
 ].join("\n");
}
