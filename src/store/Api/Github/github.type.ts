export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  language: string;
  filesCount?: number;
  status: "idle" | "scanning" | "scanned" | "cleaned";
  lastScan?: string;
  threatsFound: number;
  owner: string;
  ownerType: "User" | "Organization";
  private?: boolean;
}

export interface GithubOrgsResponse {
  user: {
    login: string;
    id: number;
    avatar_url: string;
    [key: string]: any;
  };
  orgs: Array<{
    login: string;
    type: "Organization" | "User";
  }>;
}

export interface RateLimitResponse {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export interface CleanPayload {
  fullName: string;
  filePath: string;
  sha: string;
  cleanedCode: string;
  deleteFilePath?: string;
  githubLogin?: string;
  repoId?: number;
  malwareType?: string;
  severity?: string;
}

export const getErrorMessage = (err: any): string => {
  if (!err) return "Unknown error occurred";

  // If it's a Fetch response JSON string
  if (typeof err === "string") {
    try {
      const parsed = JSON.parse(err);
      if (parsed.message) return parsed.message;
    } catch {
      // return as-is
    }
    return err;
  }

  // If it's an Error object with serialized JSON message
  if (err.message && typeof err.message === "string") {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.message) return parsed.message;
    } catch {
      // return as-is
    }
  }

  // RTK Query FetchBaseQueryError structure:
  // err = { status: 403, data: { statusCode: 403, message: "..." } }
  if (err.data && typeof err.data === "object") {
    const data = err.data as any;
    if (data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(", ");
      }
      return data.message;
    }
  }

  if (err.message) return err.message;
  if (err.status) return `HTTP Error ${err.status}`;

  return JSON.stringify(err);
};
