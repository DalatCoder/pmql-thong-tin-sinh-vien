"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
  Code,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  isActive: boolean;
  permissions: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface Permission {
  key: string;
  label: string;
}

export default function ApiKeysPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<Set<string>>(new Set());
  const [newCreatedKey, setNewCreatedKey] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/api-keys");
      const data = await response.json();
      setApiKeys(data.data || []);
      setPermissions(data.permissions || []);
    } catch {
      toast.error("Không thể tải danh sách API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Vui lòng nhập tên API key");
      return;
    }
    if (newKeyPermissions.size === 0) {
      toast.error("Vui lòng chọn ít nhất một quyền");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          permissions: Array.from(newKeyPermissions),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Tạo thất bại");
      }

      setNewCreatedKey(data.data.key);
      toast.success("Đã tạo API key!");
      fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Cập nhật thất bại");
      }

      toast.success(data.message);
      fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xác nhận xóa API key "${name}"?`)) return;

    setProcessingId(id);
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Xóa thất bại");
      }

      toast.success(data.message);
      fetchApiKeys();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy!");
  };

  const resetDialog = () => {
    setNewKeyName("");
    setNewKeyPermissions(new Set());
    setNewCreatedKey(null);
    setDialogOpen(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Chưa sử dụng";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý API Keys</h2>
          <p className="text-slate-500">Tạo và quản lý API keys cho các ứng dụng bên ngoài</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) resetDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                {newCreatedKey ? "API Key đã tạo" : "Tạo API Key mới"}
              </DialogTitle>
              <DialogDescription>
                {newCreatedKey
                  ? "Lưu key này ngay vì nó sẽ không hiện lại!"
                  : "API key dùng để xác thực các ứng dụng bên ngoài"}
              </DialogDescription>
            </DialogHeader>

            {newCreatedKey ? (
              <div className="space-y-4 py-4">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Lưu ý quan trọng!</p>
                      <p>Đây là lần duy nhất bạn có thể xem key này. Hãy copy và lưu lại ngay.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCreatedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newCreatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên ứng dụng / hệ thống</Label>
                  <Input
                    id="name"
                    placeholder="VD: Hệ thống điểm danh"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quyền truy cập</Label>
                  <div className="space-y-2">
                    {permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={newKeyPermissions.has(perm.key)}
                          onCheckedChange={(checked) => {
                            setNewKeyPermissions((prev) => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(perm.key);
                              } else {
                                next.delete(perm.key);
                              }
                              return next;
                            });
                          }}
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              {newCreatedKey ? (
                <Button onClick={resetDialog}>Đóng</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo key
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Hướng dẫn sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
          <p>Các ứng dụng bên ngoài sử dụng API key để truy cập dữ liệu sinh viên.</p>
          <p>Thêm header <code className="bg-slate-100 px-1 rounded">X-API-Key: &lt;your-key&gt;</code> vào mỗi request.</p>
        </CardContent>
      </Card>

      {/* Sample Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4 text-emerald-600" />
            Code mẫu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoints info */}
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700 mb-2">Endpoints có sẵn:</p>
            <ul className="space-y-1 text-slate-600">
              <li><code className="bg-white px-1 rounded">GET /api/v1/students</code> — Danh sách sinh viên</li>
              <li><code className="bg-white px-1 rounded">GET /api/v1/students/:studentId</code> — Chi tiết sinh viên</li>
            </ul>
          </div>

          {/* curl example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">curl</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => copyToClipboard(`curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A" \\
  -H "X-API-Key: YOUR_API_KEY"`)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
{`# Lấy danh sách sinh viên theo lớp
curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A" \\
  -H "X-API-Key: YOUR_API_KEY"

# Lấy chi tiết 1 sinh viên
curl -X GET "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students/2312663" \\
  -H "X-API-Key: YOUR_API_KEY"`}
            </pre>
          </div>

          {/* JavaScript example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">JavaScript / Node.js</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => copyToClipboard(`const response = await fetch('${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  }
});
const data = await response.json();
console.log(data);`)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
{`const response = await fetch('${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY'
  }
});
const data = await response.json();
console.log(data);`}
            </pre>
          </div>

          {/* Python example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Python</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => copyToClipboard(`import requests

response = requests.get(
    '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)
data = response.json()
print(data)`)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
{`import requests

response = requests.get(
    '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/students?classId=CTK47A',
    headers={'X-API-Key': 'YOUR_API_KEY'}
)
data = response.json()
print(data)`}
            </pre>
          </div>

          {/* Response example */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Response mẫu</span>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "studentId": "2312663",
      "fullName": "Nguyễn Văn A",
      "gender": true,
      "classStudentId": "CTK47A",
      "departmentName": "Khoa CNTT",
      "schoolEmail": "2312663@dlu.edu.vn"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "totalPages": 1
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* API Keys table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Danh sách API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : apiKeys.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Chưa có API key nào. Tạo key mới để bắt đầu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Quyền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Sử dụng lần cuối</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                          {apiKey.maskedKey}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((p) => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={apiKey.isActive ? "default" : "secondary"}
                        className={apiKey.isActive ? "bg-green-100 text-green-700" : ""}
                      >
                        {apiKey.isActive ? "Hoạt động" : "Tắt"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(apiKey.lastUsedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggle(apiKey.id, apiKey.isActive)}
                          disabled={processingId === apiKey.id}
                          title={apiKey.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          {processingId === apiKey.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : apiKey.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(apiKey.id, apiKey.name)}
                          disabled={processingId === apiKey.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
