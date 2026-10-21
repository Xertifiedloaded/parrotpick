
export type UserProfile = {
  id: string;
  firstname: string;
  surname: string;
  username: string;
  email: string;
  emailVerified: boolean;
  profilePicture: string | null;
  referralCode: string;
  balance: string;
};

export type ProfileResponse = {
  user: UserProfile;
};
