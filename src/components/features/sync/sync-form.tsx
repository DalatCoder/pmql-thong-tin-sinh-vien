"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, RefreshCcw } from "lucide-react";

// Danh sách lớp có sẵn để đồng bộ
const PREDEFINED_CLASSES = ["CTK48A", "CTK48B", "CTK47A"];

interface SyncFormProps {
  classes: { classStudentId: string }[];
}

export function SyncForm({ classes }: SyncFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [studentId, setStudentId] = useState("");

  // Merge predefined classes với classes từ database (loại bỏ trùng lặp)
  const existingClassIds = new Set(classes.map((c) => c.classStudentId));
  const allClasses = [
    ...PREDEFINED_CLASSES.filter((c) => !existingClassIds.has(c)),
    ...classes.map((c) => c.classStudentId),
  ].sort();

  const handleSyncClass = async () => {
    if (!selectedClass) {
      toast.error("Vui lòng chọn lớp cần đồng bộ");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "class", targetId: selectedClass }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đồng bộ thất bại");
      }

      if (result.success) {
        toast.success(
          `Đồng bộ thành công! ${result.recordsProcessed} sinh viên được cập nhật.`
        );
      } else {
        toast.warning(
          `Đồng bộ hoàn tất với ${result.recordsFailed} lỗi. ${result.recordsProcessed} sinh viên được cập nhật.`
        );
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStudent = async () => {
    if (!studentId.trim()) {
      toast.error("Vui lòng nhập mã số sinh viên");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "student", targetId: studentId.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Đồng bộ thất bại");
      }

      if (result.success) {
        toast.success("Đồng bộ sinh viên thành công!");
      } else {
        toast.error("Đồng bộ thất bại: " + (result.errors?.[0] || "Không xác định"));
      }

      setStudentId("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="class" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="class">Theo lớp</TabsTrigger>
        <TabsTrigger value="student">Theo mã SV</TabsTrigger>
      </TabsList>

      <TabsContent value="class" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Chọn lớp cần đồng bộ</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp..." />
            </SelectTrigger>
            <SelectContent>
              {allClasses.map((classId) => (
                <SelectItem key={classId} value={classId}>
                  {classId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleSyncClass} 
          disabled={loading || !selectedClass}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Đồng bộ lớp
        </Button>
      </TabsContent>

      <TabsContent value="student" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Nhập mã số sinh viên</Label>
          <Input
            placeholder="VD: 2312663"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>
        <Button 
          onClick={handleSyncStudent} 
          disabled={loading || !studentId.trim()}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Đồng bộ sinh viên
        </Button>
      </TabsContent>
    </Tabs>
  );
}
