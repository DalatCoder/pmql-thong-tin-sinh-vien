"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Upload, Download, Loader2, FileUp, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ImportDialogProps {
  classId?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  total: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function ImportDialog({ classId }: ImportDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async (withData: boolean) => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (classId && classId !== "all") {
        params.set("classId", classId);
      }
      if (withData) {
        params.set("withData", "true");
      }

      const response = await fetch(`/api/import/students?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Không thể tải template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = classId && classId !== "all" 
        ? `template-capnhat-${classId}.xlsx`
        : `template-capnhat-sinhvien.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải template!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/students", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      setResult(data);

      if (data.success) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.warning(data.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-blue-600" />
            Cập nhật thông tin từ Excel
          </DialogTitle>
          <DialogDescription>
            Upload file Excel để cập nhật thông tin bổ sung của sinh viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Download template */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Bước 1: Tải template mẫu</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate(false)}
                disabled={downloading}
                className="flex-1"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Template trống
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTemplate(true)}
                disabled={downloading}
                className="flex-1"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Có sẵn dữ liệu
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Chọn &quot;Có sẵn dữ liệu&quot; để tải file có sẵn danh sách sinh viên
              {classId && classId !== "all" ? ` lớp ${classId}` : ""}
            </p>
          </div>

          {/* Step 2: Upload file */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-900">Bước 2: Upload file đã điền</h4>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 px-4 cursor-pointer transition-colors ${
                  uploading
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed"
                    : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-600">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Chọn hoặc kéo thả file Excel</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-lg p-4 ${
              result.success 
                ? "bg-green-50 border border-green-200" 
                : result.updated > 0 
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : result.updated > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm">{result.message}</p>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>✓ Đã cập nhật: {result.updated} sinh viên</p>
                    <p>○ Bỏ qua: {result.skipped} dòng</p>
                  </div>
                  {result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        Xem {result.errors.length} lỗi
                      </summary>
                      <ul className="mt-1 text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-medium">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Chỉ cập nhật các trường: SĐT liên hệ, Địa chỉ tạm trú, Địa chỉ thường trú, Liên hệ khẩn cấp, Ghi chú</li>
              <li>Các trường từ Portal (họ tên, lớp, khoa...) không bị thay đổi</li>
              <li>Để xóa thông tin, để ô trống</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
