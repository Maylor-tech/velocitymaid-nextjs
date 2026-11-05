export const LEGACY_ADMIN_COOKIE_NAMES = ['adminId', 'adminSession'] as const;

type CookieStore = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict';
      path: string;
      maxAge: number;
    }
  ) => void;
};

/** Drop unsigned identity cookies. They are never accepted as credentials. */
export function clearLegacyAdminCookies(store: CookieStore): void {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };
  for (const name of LEGACY_ADMIN_COOKIE_NAMES) {
    store.set(name, '', options);
  }
}
