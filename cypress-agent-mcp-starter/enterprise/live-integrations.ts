import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { LogEntry, RootCauseReport } from './types';

const execFileAsync = promisify(execFile);

type FetchLike = typeof fetch;
type ExecLike = typeof execFileAsync;

interface JsonResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

async function ensureJson(response: JsonResponse): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export class JiraClient {
  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly apiToken: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  static fromEnv(fetchImpl: FetchLike = fetch): JiraClient {
    return new JiraClient(
      process.env.JIRA_BASE_URL ?? '',
      process.env.JIRA_EMAIL ?? '',
      process.env.JIRA_API_TOKEN ?? '',
      fetchImpl,
    );
  }

  async fetchIssue(issueKey: string): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/rest/api/3/issue/${issueKey}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });
    return ensureJson(response as JsonResponse);
  }

  async createIssue(fields: Record<string, unknown>): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    return ensureJson(response as JsonResponse);
  }
}

export class SlackClient {
  constructor(private readonly webhookUrl: string, private readonly fetchImpl: FetchLike = fetch) {}

  static fromEnv(fetchImpl: FetchLike = fetch): SlackClient {
    return new SlackClient(process.env.SLACK_WEBHOOK_URL ?? '', fetchImpl);
  }

  async postMessage(payload: Record<string, unknown>): Promise<unknown> {
    const response = await this.fetchImpl(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return ensureJson(response as JsonResponse).catch(async () => ({ text: await (response as JsonResponse).text() }));
  }
}

export class DatadogLogsClient {
  constructor(
    private readonly apiKey: string,
    private readonly appKey: string,
    private readonly site: string = process.env.DATADOG_SITE ?? 'datadoghq.com',
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  static fromEnv(fetchImpl: FetchLike = fetch): DatadogLogsClient {
    return new DatadogLogsClient(
      process.env.DATADOG_API_KEY ?? '',
      process.env.DATADOG_APP_KEY ?? '',
      process.env.DATADOG_SITE ?? 'datadoghq.com',
      fetchImpl,
    );
  }

  async queryLogs(query: string): Promise<LogEntry[]> {
    const now = new Date();
    const from = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const response = await this.fetchImpl(`https://api.${this.site}/api/v2/logs/events/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.apiKey,
        'DD-APPLICATION-KEY': this.appKey,
      },
      body: JSON.stringify({
        filter: { query, from, to: now.toISOString() },
        sort: 'timestamp',
        page: { limit: 20 },
      }),
    });
    const body = await ensureJson(response as JsonResponse) as { data?: Array<{ attributes?: Record<string, unknown> }> };
    return (body.data ?? []).map((entry) => {
      const attributes = entry.attributes ?? {};
      return {
        timestamp: String(attributes.timestamp ?? new Date().toISOString()),
        source: 'aut',
        provider: 'datadog',
        level: String(attributes.status ?? 'error') as LogEntry['level'],
        message: String(attributes.message ?? ''),
        requestId: typeof attributes.request_id === 'string' ? attributes.request_id : undefined,
        endpoint: typeof attributes.endpoint === 'string' ? attributes.endpoint : undefined,
      };
    });
  }
}

export class SplunkClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  static fromEnv(fetchImpl: FetchLike = fetch): SplunkClient {
    return new SplunkClient(process.env.SPLUNK_BASE_URL ?? '', process.env.SPLUNK_HEC_TOKEN ?? '', fetchImpl);
  }

  async search(query: string): Promise<LogEntry[]> {
    const body = new URLSearchParams({
      search: query,
      earliest_time: '-15m',
      latest_time: 'now',
      output_mode: 'json',
    });
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/services/search/jobs/export`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!(response as JsonResponse).ok) {
      throw new Error(`HTTP ${(response as JsonResponse).status}`);
    }
    const text = await (response as JsonResponse).text();
    return text.split(/\r?\n/).filter(Boolean).map((line) => {
      const parsed = JSON.parse(line) as { result?: Record<string, unknown> };
      const result = parsed.result ?? {};
      return {
        timestamp: String(result.timestamp ?? new Date().toISOString()),
        source: 'aut',
        provider: 'splunk',
        level: String(result.level ?? 'error') as LogEntry['level'],
        message: String(result.message ?? ''),
        requestId: typeof result.requestId === 'string' ? result.requestId : undefined,
        endpoint: typeof result.endpoint === 'string' ? result.endpoint : undefined,
      };
    });
  }
}

export class CloudWatchLogsClient {
  constructor(
    private readonly region: string = process.env.AWS_REGION ?? 'us-east-1',
    private readonly execImpl: ExecLike = execFileAsync,
  ) {}

  async filterLogEvents(logGroupName: string, filterPattern = ''): Promise<LogEntry[]> {
    const args = ['logs', 'filter-log-events', '--log-group-name', logGroupName, '--output', 'json'];
    if (filterPattern) {
      args.push('--filter-pattern', filterPattern);
    }
    const { stdout } = await this.execImpl('aws', args, {
      env: { ...process.env, AWS_REGION: this.region },
    });
    const parsed = JSON.parse(stdout) as { events?: Array<Record<string, unknown>> };
    return (parsed.events ?? []).map((event) => ({
      timestamp: new Date(Number(event.timestamp ?? Date.now())).toISOString(),
      source: 'aut',
      provider: 'cloudwatch',
      level: 'error',
      message: String(event.message ?? ''),
    }));
  }
}

export class VaultClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  static fromEnv(fetchImpl: FetchLike = fetch): VaultClient {
    return new VaultClient(process.env.VAULT_ADDR ?? '', process.env.VAULT_TOKEN ?? '', fetchImpl);
  }

  async resolveReference(reference: string): Promise<string | undefined> {
    if (!reference.startsWith('vault://')) {
      return reference;
    }
    const locator = reference.slice('vault://'.length);
    const [path, fieldName] = locator.split('#');
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/v1/${path}`, {
      headers: { 'X-Vault-Token': this.token, Accept: 'application/json' },
    });
    const body = await ensureJson(response as JsonResponse) as { data?: { data?: Record<string, unknown> } | Record<string, unknown> };
    const payload = (body.data && 'data' in body.data ? body.data.data : body.data) as Record<string, unknown> | undefined;
    if (!payload) {
      return undefined;
    }
    if (!fieldName) {
      return JSON.stringify(payload);
    }
    const value = payload[fieldName];
    return value == null ? undefined : String(value);
  }
}

export async function collectLiveAutLogs(
  queries: {
    datadogQuery?: string;
    splunkQuery?: string;
    cloudWatchLogGroup?: string;
    cloudWatchFilter?: string;
  },
  clients?: {
    datadog?: DatadogLogsClient;
    splunk?: SplunkClient;
    cloudWatch?: CloudWatchLogsClient;
  },
): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];

  if (queries.datadogQuery && process.env.DATADOG_LIVE_INTEGRATION_ENABLED === 'true') {
    logs.push(...await (clients?.datadog ?? DatadogLogsClient.fromEnv()).queryLogs(queries.datadogQuery));
  }

  if (queries.splunkQuery && process.env.SPLUNK_LIVE_INTEGRATION_ENABLED === 'true') {
    logs.push(...await (clients?.splunk ?? SplunkClient.fromEnv()).search(queries.splunkQuery));
  }

  if (queries.cloudWatchLogGroup && process.env.CLOUDWATCH_LIVE_INTEGRATION_ENABLED === 'true') {
    logs.push(...await (clients?.cloudWatch ?? new CloudWatchLogsClient()).filterLogEvents(
      queries.cloudWatchLogGroup,
      queries.cloudWatchFilter,
    ));
  }

  return logs;
}

export async function publishEnterpriseAlerts(
  report: RootCauseReport,
  options: { jiraProjectKey?: string; jiraIssueType?: string; slack?: boolean } = {},
  clients?: { jira?: JiraClient; slack?: SlackClient },
): Promise<void> {
  if (process.env.SLACK_LIVE_INTEGRATION_ENABLED === 'true' && options.slack !== false) {
    const slackAlert = report.alertPayloads.find((payload) => payload.channel === 'slack');
    if (slackAlert) {
      await (clients?.slack ?? SlackClient.fromEnv()).postMessage({
        text: slackAlert.title,
        attachments: [{ text: slackAlert.body }],
      });
    }
  }

  if (process.env.JIRA_LIVE_INTEGRATION_ENABLED === 'true' && options.jiraProjectKey) {
    const jiraAlert = report.alertPayloads.find((payload) => payload.channel === 'jira');
    if (jiraAlert) {
      await (clients?.jira ?? JiraClient.fromEnv()).createIssue({
        project: { key: options.jiraProjectKey },
        issuetype: { name: options.jiraIssueType ?? 'Bug' },
        summary: jiraAlert.title,
        description: jiraAlert.body,
        labels: ['ai-rca'],
      });
    }
  }
}
