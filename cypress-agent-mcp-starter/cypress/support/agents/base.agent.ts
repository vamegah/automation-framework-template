export interface AgentTask {
  url: string;
  name?: string;
  actions: AgentAction[];
}

export type AgentAction =
  | { type: 'login'; username: string; password: string }
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; value: string }
  | { type: 'screenshot'; path: string }
  | { type: 'navigate'; url?: string }
  | { type: 'assertText'; text?: string; value?: string }
  | { type: 'assertUrl'; url?: string };

export interface AgentMap {
  tasks: AgentTask[];
}

export abstract class BaseAgent {
  abstract execute(map: AgentMap): Promise<void> | void;
}
