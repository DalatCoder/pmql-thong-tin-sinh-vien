"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, Loader2, FileSpreadsheet } from "lucide-react";

interface ExportColumn {
  key: string;
  label: string;
}

interface ExportDialogProps {
  classId?: string;
  search?: string;
}

const DEFAULT_COLUMNS = [
  "studentId",
  "fullName",
  "gender",
  "birthday",
  "classStudentId",
  "specialtyName",
  "studyStatusName",
  "customPhone",
  "portalPhone",
  "schoolEmail",
];

export function ExportDialog({ classId, search }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingColumns, setFetchingColumns] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, ExportColumn[]>>({});
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(DEFAULT_COLUMNS)
  );

  // Fetch available columns
  useEffect(() => {
    if (open && Object.keys(grouped).length === 0) {
      setFetchingColumns(true);
      fetch("/api/export/students")
        .then((res) => res.json())
        .then((data) => {
          setGrouped(data.grouped);
        })
        .catch(() => {
          toast.error("Không thể tải danh sách cột");
        })
        .finally(() => {
          setFetchingColumns(false);
        });
    }
  }, [open, grouped]);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleGroup = (columns: ExportColumn[]) => {
    const allSelected = columns.every((col) => selectedColumns.has(col.key));
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      columns.forEach((col) => {
        if (allSelected) {
          next.delete(col.key);
        } else {
          next.add(col.key);
        }
      });
      return next;
    });
  };

  const selectAll = () => {
    const allKeys = Object.values(grouped)
      .flat()
      .map((col) => col.key);
    setSelectedColumns(new Set(allKeys));
  };

  const deselectAll = () => {
    setSelectedColumns(new Set());
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast.error("Vui lòng chọn ít nhất một cột");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/export/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: Array.from(selectedColumns),
          classId: classId !== "all" ? classId : undefined,
          search: search || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Xuất file thất bại");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sinh-vien-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Xuất file thành công!");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Xuất danh sách sinh viên
          </DialogTitle>
          <DialogDescription>
            Chọn các cột thông tin cần xuất ra file Excel
          </DialogDescription>
        </DialogHeader>

        {fetchingColumns ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="flex gap-2 pb-2 border-b">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Chọn tất cả
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Bỏ chọn tất cả
              </Button>
              <span className="ml-auto text-sm text-slate-500">
                Đã chọn: <strong>{selectedColumns.size}</strong> cột
              </span>
            </div>

            {/* Columns grouped */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {Object.entries(grouped).map(([groupName, columns]) => {
                const allSelected = columns.every((col) =>
                  selectedColumns.has(col.key)
                );
                const someSelected = columns.some((col) =>
                  selectedColumns.has(col.key)
                );

                return (
                  <div key={groupName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            (el as unknown as HTMLInputElement).indeterminate =
                              someSelected && !allSelected;
                          }
                        }}
                        onCheckedChange={() => toggleGroup(columns)}
                      />
                      <span className="font-medium text-slate-900">
                        {groupName}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({columns.filter((c) => selectedColumns.has(c.key)).length}/
                        {columns.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-6">
                      {columns.map((col) => (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:text-slate-900"
                        >
                          <Checkbox
                            checked={selectedColumns.has(col.key)}
                            onCheckedChange={() => toggleColumn(col.key)}
                          />
                          <span className="text-slate-600">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || selectedColumns.size === 0}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Xuất file ({selectedColumns.size} cột)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
