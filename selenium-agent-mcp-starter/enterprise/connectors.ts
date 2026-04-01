import { RequirementReference, WorkItemSource } from './types';

type PlainObject = Record<string, unknown>;

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseBusinessImpact(labels: string[], fallback?: string): RequirementReference['businessImpact'] {
  const normalized = [fallback, ...labels].filter(Boolean).map((item) => String(item).toLowerCase());
  if (normalized.some((item) => item.includes('critical'))) {
    return 'critical';
  }
  if (normalized.some((item) => item.includes('high'))) {
    return 'high';
  }
  if (normalized.some((item) => item.includes('medium'))) {
    return 'medium';
  }
  return 'low';
}

function ensureCriteria(value: unknown): string[] {
  const criteria = asArray(value);
  if (criteria.length > 0) {
    return criteria;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function parseWebhookRequirement(source: WorkItemSource, payload: PlainObject): RequirementReference {
  if (source === 'jira') {
    const issue = payload.issue as PlainObject;
    const fields = (issue?.fields ?? {}) as PlainObject;
    const labels = asArray(fields.labels);

    return {
      id: String(issue?.key ?? ''),
      title: String(fields.summary ?? 'Untitled Jira Story'),
      description: String(fields.description ?? ''),
      acceptanceCriteria: ensureCriteria(fields.acceptanceCriteria ?? fields.customfield_10001),
      linkedRequirements: asArray(fields.linkedRequirements ?? fields.issuelinks),
      source,
      url: typeof payload.url === 'string' ? payload.url : undefined,
      labels,
      businessImpact: parseBusinessImpact(labels, String(fields.businessImpact ?? '')),
    };
  }

  if (source === 'azure-devops') {
    const resource = payload.resource as PlainObject;
    const fields = (resource?.fields ?? {}) as PlainObject;
    const labels = String(fields['System.Tags'] ?? '').split(';').map((item) => item.trim()).filter(Boolean);

    return {
      id: String(resource?.id ?? ''),
      title: String(fields['System.Title'] ?? 'Untitled Azure Work Item'),
      description: String(fields['System.Description'] ?? ''),
      acceptanceCriteria: ensureCriteria(fields['Microsoft.VSTS.Common.AcceptanceCriteria']),
      linkedRequirements: asArray(resource?.relations),
      source,
      url: typeof resource?.url === 'string' ? resource.url : undefined,
      labels,
      businessImpact: parseBusinessImpact(labels, String(fields['Custom.BusinessImpact'] ?? '')),
    };
  }

  const data = payload.data as PlainObject;
  const issue = (data?.issue ?? {}) as PlainObject;
  const labelNodes = Array.isArray(issue.labels) ? (issue.labels as PlainObject[]) : [];
  const labels = labelNodes.map((label) => String(label.name ?? '').trim()).filter(Boolean);

  return {
    id: String(issue.identifier ?? issue.id ?? ''),
    title: String(issue.title ?? 'Untitled Linear Issue'),
    description: String(issue.description ?? ''),
    acceptanceCriteria: ensureCriteria(issue.acceptanceCriteria ?? issue.description),
    linkedRequirements: asArray(issue.relatedIssueIds),
    source,
    url: typeof issue.url === 'string' ? issue.url : undefined,
    labels,
    businessImpact: parseBusinessImpact(labels, String(issue.priorityLabel ?? '')),
  };
}
