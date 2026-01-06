"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StudentEditFormProps {
  studentId: string;
  initialData: {
    customPhone: string | null;
    temporaryAddress: string | null;
    permanentAddress: string | null;
    emergencyContact: string | null;
    emergencyPhone: string | null;
    notes: string | null;
  };
}

export function StudentEditForm({ studentId, initialData }: StudentEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customPhone: initialData.customPhone || "",
    temporaryAddress: initialData.temporaryAddress || "",
    permanentAddress: initialData.permanentAddress || "",
    emergencyContact: initialData.emergencyContact || "",
    emergencyPhone: initialData.emergencyPhone || "",
    notes: initialData.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Cập nhật thất bại");
      }

      toast.success("Đã cập nhật thông tin sinh viên");
      router.refresh();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customPhone">SĐT liên hệ (cập nhật)</Label>
          <Input
            id="customPhone"
            placeholder="0123456789"
            value={formData.customPhone}
            onChange={(e) => setFormData({ ...formData, customPhone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyPhone">SĐT khẩn cấp</Label>
          <Input
            id="emergencyPhone"
            placeholder="0123456789"
            value={formData.emergencyPhone}
            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContact">Người liên hệ khẩn cấp</Label>
        <Input
          id="emergencyContact"
          placeholder="Họ tên người liên hệ"
          value={formData.emergencyContact}
          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="temporaryAddress">Địa chỉ tạm trú</Label>
        <Input
          id="temporaryAddress"
          placeholder="Địa chỉ nơi sinh viên đang ở"
          value={formData.temporaryAddress}
          onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="permanentAddress">Địa chỉ thường trú (cập nhật)</Label>
        <Input
          id="permanentAddress"
          placeholder="Địa chỉ thường trú"
          value={formData.permanentAddress}
          onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          placeholder="Ghi chú về sinh viên..."
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
