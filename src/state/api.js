

// src/state/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL =
  process.env.REACT_APP_BASE_URL || "http://localhost:5000/api";

console.log("✅ API BASE URL:", BASE_URL);

export const api = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",

    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["Auth", "Admins", "Users", "Roles", "Permissions"],

  endpoints: (builder) => ({
    /* ================= AUTH ================= */
    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    verifyOtp: builder.mutation({
    query: (data) => ({
      url: "/auth/verify-otp",
      method: "POST",
      body: data,
    }),
  }),

    register: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    /* ================= ADMINS ================= */
    getAdmins: builder.query({
      query: () => "/admins",
      providesTags: ["Admins"],
    }),

    createAdmin: builder.mutation({
      query: (body) => ({
        url: "/admins",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admins"],
    }),

    updateAdmin: builder.mutation({
      query: ({ id, body }) => ({
        url: `/admins/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Admins"],
    }),

    toggleAdminStatus: builder.mutation({
      query: (id) => ({
        url: `/admins/${id}/status`,
        method: "PATCH",
      }),
      invalidatesTags: ["Admins"],
    }),

    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `/admins/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admins"],
    }),

    /* ================= USERS ================= */
    getUsers: builder.query({
      query: () => "/users",
      providesTags: ["Users"],
    }),

    /* ================= ROLES ================= */
    getRoles: builder.query({
      query: () => "/roles",
      providesTags: ["Roles"],
    }),

    createRole: builder.mutation({
      query: (body) => ({
        url: "/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    updateRole: builder.mutation({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    assignPermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/roles/${roleId}/permissions`,
        method: "PUT",
        body: { permissions },
      }),
      invalidatesTags: ["Roles"],
    }),

    /* ================= PERMISSIONS ================= */
    getPermissions: builder.query({
      query: () => "/permissions",
      providesTags: ["Permissions"],
    }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: "/permissions",
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
