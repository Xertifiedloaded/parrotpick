export type UserProfile = {
  id: string;
  firstname: string;
  surname: string;
  username: string;
  email: string;
  emailVerified: boolean;
  profilePicture: string | null;
  referralCode: string;
  /** BigInt serialised as a string (kobo). */
  balance: string;

  bio: string | null;
  phone: string | null;
  /** ISO 3166-1 alpha-2, e.g. "NG". */
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  /** "YYYY-MM-DD" */
  dateOfBirth: string | null;
  notificationsEnabled: boolean;
};

export type ProfileResponse = {
  user: UserProfile;
};