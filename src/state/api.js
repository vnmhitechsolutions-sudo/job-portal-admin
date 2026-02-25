

// src/state/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://13.205.65.243/api";

console.log("✅ API BASE URL:", BASE_URL);

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",

  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.warn("🔐 Session expired (401). Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithReauth,

  tagTypes: ["Auth", "Admins", "Users", "Roles", "Permissions"],

  endpoints: (builder) => ({
    /* ================= AUTH ================= */
    login: builder.mutation({
      query: (body) => ({
        url: "/admin/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/admin/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),


    register: builder.mutation({
      query: (body) => ({
        url: "/admin/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    /* ================= ADMINS ================= */
    getAdmins: builder.query({
      query: () => "/admin/users",
      providesTags: ["Admins"],
    }),

    createAdmin: builder.mutation({
      query: (body) => ({
        url: "/admin/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admins"],
    }),

    updateAdmin: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Admins"],
    }),

    toggleAdminStatus: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["Admins"],
    }),

    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admins"],
    }),

    /* ================= USERS ================= */
    getUsers: builder.query({
      query: () => "/admin/users",
      providesTags: ["Users"],
    }),

    /* ================= ROLES ================= */
    getRoles: builder.query({
      query: () => "/admin/roles",
      providesTags: ["Roles"],
    }),

    createRole: builder.mutation({
      query: (body) => ({
        url: "/admin/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    updateRole: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admin/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    assignPermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/admin/roles/${roleId}/permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: ["Roles"],
    }),

    /* ================= PERMISSIONS ================= */
    getPermissions: builder.query({
      query: () => "/admin/permissions",
      providesTags: ["Permissions"],
    }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: "/admin/permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permissions"],
    }),
  }),
});

/* ===== Hooks Export ===== */
export const {
  useLoginMutation,
  useRegisterMutation,

  /* ADMINS */
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useToggleAdminStatusMutation,
  useDeleteAdminMutation,

  /* USERS */
  useGetUsersQuery,

  /* ROLES */
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignPermissionsMutation,

  /* PERMISSIONS */
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useVerifyOtpMutation,
} = api;
