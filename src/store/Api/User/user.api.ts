import baseApi from "../BaseApi/BaseApi";
import type { UserProfile, UpdateProfilePayload } from "./user.type";

const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfile, string>({
      query: (id) => `/user/profile/${id}`,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    updateUserProfile: builder.mutation<UserProfile, { id: string; payload: UpdateProfilePayload }>({
      query: ({ id, payload }) => ({
        url: `/user/profile/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    }),
  }),
});

export const { useGetUserProfileQuery, useUpdateUserProfileMutation } = userApi;
export default userApi;
