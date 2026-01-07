"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ClassOption {
  id: string;
  classStudentId: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface ClassOptionsManagerProps {
  classOptions: ClassOption[];
}

export function ClassOptionsManager({ classOptions }: ClassOptionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newClassId, setNewClassId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newClassId.trim()) {
      toast.error("Vui lòng nhập mã lớp");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/class-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classStudentId: newClassId.trim(),
          description: newDescription.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Thêm thất bại");
      }

      toast.success(`Đã thêm lớp ${result.classStudentId}`);
      setNewClassId("");
      setNewDescription("");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, classStudentId: string) => {
    if (!confirm(`Xác nhận xóa lớp ${classStudentId}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/class-options/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Xóa thất bại");
      }

      toast.success(`Đã xóa lớp ${classStudentId}`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Form thêm mới */}
      <div className="flex gap-2">
        <Input
          placeholder="Mã lớp (VD: CTK49A)"
          value={newClassId}
          onChange={(e) => setNewClassId(e.target.value)}
          className="flex-1 max-w-[200px]"
        />
        <Input
          placeholder="Mô tả (tùy chọn)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={isAdding || !newClassId.trim()}>
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-1">Thêm</span>
        </Button>
      </div>

      {/* Bảng danh sách */}
      {classOptions.length === 0 ? (
        <p className="text-center text-slate-500 py-6">
          Chưa có lớp nào. Thêm lớp mới bằng form trên.
        </p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">STT</TableHead>
                <TableHead>Mã lớp</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[80px] text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classOptions.map((option, index) => (
                <TableRow key={option.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-mono">{option.classStudentId}</TableCell>
                  <TableCell className="text-slate-500">
                    {option.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={option.isActive ? "default" : "secondary"}
                      className={option.isActive ? "bg-green-100 text-green-700" : ""}
                    >
                      {option.isActive ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(option.id, option.classStudentId)}
                      disabled={deletingId === option.id || isPending}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === option.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
