import baseApi from "../BaseApi/BaseApi";
import type { Repository, GithubOrgsResponse, RateLimitResponse, CleanPayload } from "./github.type";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("github_pat") || ""}`,
});

const githubApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGithubRepos: builder.query<Repository[], void>({
      query: () => ({
        url: "/github/repos",
        headers: getHeaders(),
      }),
      providesTags: ["Github"],
    }),
    getGithubOrgs: builder.query<GithubOrgsResponse, void>({
      query: () => ({
        url: "/github/orgs",
        headers: getHeaders(),
      }),
      providesTags: ["Github"],
    }),
    getGithubHistory: builder.query<any[], string>({
      query: (githubLogin) => ({
        url: `/github/history?githubLogin=${githubLogin}`,
        headers: getHeaders(),
      }),
      providesTags: ["Github"],
    }),
    getGithubRateLimit: builder.query<RateLimitResponse, void>({
      query: () => ({
        url: "/github/rate-limit",
        headers: getHeaders(),
      }),
      providesTags: ["Github"],
    }),
    cleanRepositoryFile: builder.mutation<any, CleanPayload>({
      query: (payload) => ({
        url: "/github/clean",
        method: "POST",
        body: payload,
        headers: getHeaders(),
      }),
      invalidatesTags: ["Github"],
    }),
  }),
});

export const {
  useGetGithubReposQuery,
  useGetGithubOrgsQuery,
  useGetGithubHistoryQuery,
  useGetGithubRateLimitQuery,
  useCleanRepositoryFileMutation,
} = githubApi;
export default githubApi;
