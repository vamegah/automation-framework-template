import { MaskingResult, SeedScript, SyntheticProfile, SyntheticRecord } from './types';

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function digits(input: string): string {
  return input.replace(/\D/g, '');
}

export function generateSyntheticRecords(profile: SyntheticProfile, count: number): SyntheticRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const firstName = pick(profile.firstNamePool, index);
    const lastName = pick(profile.lastNamePool, index + 1);
    const city = pick(profile.cities, index + 2);
    const cardPrefix = pick(profile.cardPrefixes, index);
    const accountId = 10000 + index;

    return {
      customer_id: accountId,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName}.${lastName}.${accountId}@${profile.emailDomain}`.toLowerCase(),
      city,
      credit_card: `${cardPrefix}${String(100000000000 + index).padStart(12, '0')}`.slice(0, 16),
      ssn: `999-55-${String(1000 + index).slice(-4)}`,
      marketing_opt_in: index % 2 === 0,
      locale: profile.locale,
    };
  });
}

export function maskSensitiveFields(record: SyntheticRecord): MaskingResult {
  const maskedFields: string[] = [];
  const maskedRecord: SyntheticRecord = {};

  Object.entries(record).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (/\b\d{3}-\d{2}-\d{4}\b/.test(value) || /ssn/i.test(key)) {
        maskedRecord[key] = `***-**-${value.slice(-4)}`;
        maskedFields.push(key);
        return;
      }

      const numeric = digits(value);
      if ((/credit|card/i.test(key) || /^\d{15,16}$/.test(numeric)) && numeric.length >= 12) {
        maskedRecord[key] = `${'*'.repeat(Math.max(0, numeric.length - 4))}${numeric.slice(-4)}`;
        maskedFields.push(key);
        return;
      }
    }

    maskedRecord[key] = value;
  });

  return { maskedRecord, maskedFields };
}

function sqlValue(value: SyntheticRecord[string]): string {
  if (value === null) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function buildSeedScript(tableName: string, records: SyntheticRecord[]): SeedScript {
  const columns = Object.keys(records[0] ?? {});
  const values = records.map((record) => `(${columns.map((column) => sqlValue(record[column])).join(', ')})`).join(',\n');

  return {
    tableName,
    sql: `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n${values};`,
  };
}
