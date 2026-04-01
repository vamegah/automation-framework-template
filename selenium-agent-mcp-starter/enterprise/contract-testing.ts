import { ContractTestArtifact, ContractValidationResult, JsonContractSchema, JsonSchemaProperty } from './types';

function inferProperty(value: unknown): JsonSchemaProperty {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferProperty(value[0]) : { type: 'null' },
    };
  }

  if (value === null) {
    return { type: 'null' };
  }

  switch (typeof value) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'object': {
      const entries = Object.entries(value as Record<string, unknown>);
      return {
        type: 'object',
        properties: Object.fromEntries(entries.map(([key, nested]) => [key, inferProperty(nested)])),
      };
    }
    default:
      return { type: 'null' };
  }
}

export function inferJsonSchema(sample: unknown): JsonContractSchema {
  if (Array.isArray(sample)) {
    return {
      type: 'array',
      items: sample.length > 0 ? inferProperty(sample[0]) : { type: 'null' },
      required: [],
    };
  }

  const objectValue = sample as Record<string, unknown>;
  const entries = Object.entries(objectValue ?? {});
  return {
    type: 'object',
    properties: Object.fromEntries(entries.map(([key, value]) => [key, inferProperty(value)])),
    required: entries.map(([key]) => key),
  };
}

function validateProperty(path: string, schema: JsonSchemaProperty, value: unknown, errors: string[]): void {
  if (schema.type === 'null') {
    if (value !== null && value !== undefined) {
      errors.push(`${path} expected null`);
    }
    return;
  }

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path} expected array`);
      return;
    }
    if (schema.items && value.length > 0) {
      validateProperty(`${path}[0]`, schema.items, value[0], errors);
    }
    return;
  }

  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${path} expected object`);
      return;
    }
    Object.entries(schema.properties ?? {}).forEach(([key, nested]) => {
      validateProperty(`${path}.${key}`, nested, (value as Record<string, unknown>)[key], errors);
    });
    return;
  }

  if (typeof value !== schema.type) {
    errors.push(`${path} expected ${schema.type}`);
  }
}

export function validateJsonAgainstSchema(payload: unknown, schema: JsonContractSchema): ContractValidationResult {
  const errors: string[] = [];

  if (schema.type === 'array') {
    if (!Array.isArray(payload)) {
      errors.push('payload expected array');
    } else if (schema.items && payload.length > 0) {
      validateProperty('payload[0]', schema.items, payload[0], errors);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    errors.push('payload expected object');
    return { valid: false, errors };
  }

  const record = payload as Record<string, unknown>;
  schema.required.forEach((key) => {
    if (!(key in record)) {
      errors.push(`payload.${key} is required`);
    }
  });

  Object.entries(schema.properties ?? {}).forEach(([key, property]) => {
    validateProperty(`payload.${key}`, property, record[key], errors);
  });

  return { valid: errors.length === 0, errors };
}

export function generateContractTestArtifact(endpointName: string, schema: JsonContractSchema): ContractTestArtifact {
  const schemaLiteral = JSON.stringify(schema, null, 2);
  const slug = endpointName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
    fileName: `${slug}.contract.spec.ts`,
    content: [
      `import { expect } from 'chai';`,
      `import { validateJsonAgainstSchema } from '../../enterprise/contract-testing';`,
      '',
      `const schema = ${schemaLiteral} as const;`,
      '',
      `describe('${endpointName} contract', () => {`,
      `  it('validates the response schema', async () => {`,
      '    const payload = {};',
      '    const result = validateJsonAgainstSchema(payload, schema);',
      "    expect(result.valid, result.errors.join('\\n')).to.equal(true);",
      '  });',
      '});',
      '',
    ].join('\n'),
  };
}
