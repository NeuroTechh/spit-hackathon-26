"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, type AdminUser } from "@/lib/api";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Users
        </h1>
        <p className="text-zinc-500 mt-1">
          Manage platform users and their roles.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 rounded-lg border border-zinc-300 text-sm text-zinc-700 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="organizer">Organizer</option>
          <option value="verifier">Verifier</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <th className="text-left px-5 py-3 font-medium text-zinc-500">
                Name
              </th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">
                Role
              </th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">
                Reputation
              </th>
              <th className="text-left px-5 py-3 font-medium text-zinc-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-zinc-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                    >
                      {u.displayName || "Unnamed"}
                    </Link>
                    <p className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
                      {u.did}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-brand-blue text-white"
                          : u.role === "verifier"
                          ? "bg-purple-50 text-purple-700"
                          : u.role === "organizer"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-700">
                    {u.reputationScore}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {total} users total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-zinc-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
