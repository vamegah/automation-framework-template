import * as fs from 'fs';
import * as path from 'path';
import { EnterpriseAgent, EnterpriseGenerationRequest } from '../ai/agents/enterprise-agent';

const inputPath = process.argv[2] ?? 'enterprise-map.json';
const repoRoot = path.resolve(__dirname, '..');
const absoluteInputPath = path.resolve(repoRoot, inputPath);
const request = JSON.parse(fs.readFileSync(absoluteInputPath, 'utf8')) as EnterpriseGenerationRequest;

const agent = new EnterpriseAgent();
const result = agent.generate(request, repoRoot);

console.log(`Generated enterprise artifacts in ${result.outputDir}`);
