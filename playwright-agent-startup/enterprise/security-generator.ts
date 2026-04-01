import { RequirementReference, SecurityTestCase } from './types';

function buildCase(id: string, title: string, category: SecurityTestCase['category'], severity: SecurityTestCase['severity'], steps: string[], expectedResults: string[]): SecurityTestCase {
  return {
    id,
    title,
    category,
    severity,
    preconditions: ['Target endpoint or page is reachable in a non-production environment.'],
    steps,
    expectedResults,
  };
}

export function generateOwaspSecurityCases(requirement: RequirementReference, surface: 'ui' | 'api'): SecurityTestCase[] {
  const prefix = requirement.id.replace(/[^A-Za-z0-9]+/g, '-');
  const loginTarget = surface === 'api' ? 'login API' : 'login form';

  return [
    buildCase(
      `${prefix}-SEC-1`,
      `${requirement.id} rejects SQL injection in the ${loginTarget}`,
      'sql-injection',
      'critical',
      [
        `Submit the ${loginTarget} with username "' OR '1'='1" and a dummy password.`,
        'Observe the authentication response and any backend error handling.',
      ],
      [
        'Authentication is rejected with a safe validation or authorization error.',
        'No SQL error details are exposed to the user.',
      ],
    ),
    buildCase(
      `${prefix}-SEC-2`,
      `${requirement.id} neutralizes reflected XSS payloads`,
      'xss',
      'high',
      [
        'Submit a payload like <script>alert(1)</script> into a user-controlled field.',
        'Navigate to the confirmation or error view that re-renders the value.',
      ],
      [
        'Payload is encoded or rejected.',
        'No script execution occurs in the browser.',
      ],
    ),
    buildCase(
      `${prefix}-SEC-3`,
      `${requirement.id} prevents authentication bypass with missing or tampered tokens`,
      'auth-bypass',
      'critical',
      [
        'Replay the protected request without the expected auth token or session cookie.',
        'Repeat with a tampered token value.',
      ],
      [
        'Access is denied consistently.',
        'The system does not treat malformed tokens as authenticated.',
      ],
    ),
    buildCase(
      `${prefix}-SEC-4`,
      `${requirement.id} validates oversized and special-character input safely`,
      'input-validation',
      'high',
      [
        'Submit extremely long strings, Unicode control characters, and special characters in user inputs.',
        'Observe validation and server responses.',
      ],
      [
        'Validation remains stable and user-friendly.',
        'The application does not return a 500-level error.',
      ],
    ),
  ];
}
