export interface UiTestCase {
  title: string;
  tags: string[];
  preconditions: string[];
  steps: string[];
  assertions: string[];
}

export interface UiStoryInput {
  feature: string;
  route: string;
  acceptanceCriteria: string[];
}

export class UiTestDesigner {
  design(input: UiStoryInput): UiTestCase[] {
    const baseTags = ['@ui', '@regression'];

    return input.acceptanceCriteria.map((criterion, index) => ({
      title: `${input.feature} scenario ${index + 1}`,
      tags: index === 0 ? [...baseTags, '@smoke'] : baseTags,
      preconditions: [`User can access ${input.route}`],
      steps: [
        `Navigate to ${input.route}`,
        `Exercise the workflow described by the criterion`,
      ],
      assertions: [criterion],
    }));
  }
}

export const uiTestDesigner = new UiTestDesigner();
