"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, LogIn, LogOut, CheckCircle, AlertCircle } from "lucide-react";

interface PortalAuthStatus {
  authenticated: boolean;
  user?: { name: string; id: string };
  expiresAt?: string;
  expired?: boolean;
}

export function PortalLoginForm() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [authStatus, setAuthStatus] = useState<PortalAuthStatus | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Kiểm tra trạng thái đăng nhập khi mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch("/api/portal-auth");
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error("Failed to check auth status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/portal-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      toast.success(`Đăng nhập thành công! Xin chào ${data.user.name}`);
      setAuthStatus({
        authenticated: true,
        user: data.user,
        expiresAt: data.expiresAt,
      });
      setUsername("");
      setPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/portal-auth", { method: "DELETE" });
      setAuthStatus({ authenticated: false });
      toast.success("Đã đăng xuất Portal");
    } catch (error) {
      toast.error("Đăng xuất thất bại");
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  // Đã đăng nhập
  if (authStatus?.authenticated) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <div className="font-medium text-green-900">
              Đã kết nối Portal
            </div>
            <div className="text-sm text-green-700">
              {authStatus.user?.name} ({authStatus.user?.id})
            </div>
            {authStatus.expiresAt && (
              <div className="text-xs text-green-600 mt-1">
                Token hết hạn: {formatExpiry(authStatus.expiresAt)}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Bạn có thể thực hiện đồng bộ dữ liệu sinh viên phía dưới.
        </p>
      </div>
    );
  }

  // Chưa đăng nhập hoặc token hết hạn
  return (
    <div className="space-y-4">
      {authStatus?.expired && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4" />
          Token đã hết hạn. Vui lòng đăng nhập lại.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="portal-username">Tài khoản Portal</Label>
          <Input
            id="portal-username"
            placeholder="Mã giảng viên"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portal-password">Mật khẩu</Label>
          <Input
            id="portal-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Đăng nhập Portal
        </Button>
      </form>
      <p className="text-xs text-slate-500">
        Sử dụng tài khoản Portal của trường để kết nối và đồng bộ dữ liệu sinh viên.
      </p>
    </div>
  );
}
