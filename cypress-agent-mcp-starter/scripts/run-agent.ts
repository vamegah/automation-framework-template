import * as path from 'path';
import { TestGeneratorAgent } from '../cypress/support/agents/test-generator.agent';

const mapPath = process.argv[2] ?? 'agent_maps/sample-agent-map.json';
const repoRoot = path.resolve(__dirname, '..');
const agent = new TestGeneratorAgent();
const outputPath = agent.generateFromFile(mapPath, repoRoot);

console.log(`Generated Cypress AI spec: ${outputPath}`);
