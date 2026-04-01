function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface SeleniumUserData {
  username: string;
  password: string;
  email: string;
}

export const TestData = {
  user(overrides: Partial<SeleniumUserData> = {}): SeleniumUserData {
    const id = uid();
    return {
      username: `user.${id}`,
      password: `P@ssword!${id}`,
      email: `user.${id}@example.com`,
      ...overrides,
    };
  },
};
