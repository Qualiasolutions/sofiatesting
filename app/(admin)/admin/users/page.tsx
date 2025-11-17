"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  adminRole: string | null;
  recentActivity: {
    messages: number;
    documents: number;
    cost: number;
    tokens: number;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?page=${page}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handlePromoteUser = async (userId: string, role: string = "admin") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "promote", userId, role }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to promote user");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      alert("Failed to promote user");
    }
  };

  const handleDemoteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove admin role from this user?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demote", userId }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to demote user");
      }
    } catch (error) {
      console.error("Error demoting user:", error);
      alert("Failed to demote user");
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and assign admin roles
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{data?.pagination.total || 0}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold">
            {data?.users.filter((u) => u.isAdmin).length || 0}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Page</p>
          <p className="text-2xl font-bold">
            {data?.pagination.page} / {data?.pagination.totalPages}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Messages (7d)</TableHead>
              <TableHead>Documents (7d)</TableHead>
              <TableHead>Cost (7d)</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {user.adminRole}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">User</span>
                  )}
                </TableCell>
                <TableCell>{user.recentActivity.messages}</TableCell>
                <TableCell>{user.recentActivity.documents}</TableCell>
                <TableCell>${user.recentActivity.cost.toFixed(4)}</TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDemoteUser(user.id)}
                    >
                      Demote
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteUser(user.id, "admin")}
                      >
                        Make Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteUser(user.id, "superadmin")}
                      >
                        Make Superadmin
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
