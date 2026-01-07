"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Eye, Phone } from "lucide-react";
import { ExportDialog } from "./export-dialog";

interface Student {
  id: string;
  studentId: string;
  fullName: string;
  gender: boolean;
  birthday: string | null;
  classStudentId: string | null;
  departmentName: string | null;
  studyStatusName: string | null;
  specialtyName: string | null;
  schoolEmail: string | null;
  customPhone: string | null;
  portalPhone: string | null;
  fileImage: string | null;
  lastSyncedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StudentsTableProps {
  initialData: {
    data: Student[];
    pagination: Pagination;
  };
  classes: { classStudentId: string }[];
}

export function StudentsTable({ initialData, classes }: StudentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [classFilter, setClassFilter] = useState(searchParams.get("classId") || "all");

  const { data: students, pagination } = initialData;

  const updateFilters = (newSearch?: string, newClass?: string, newPage?: number) => {
    const params = new URLSearchParams();
    
    const searchValue = newSearch !== undefined ? newSearch : search;
    const classValue = newClass !== undefined ? newClass : classFilter;
    const page = newPage || 1;
    
    if (searchValue) params.set("search", searchValue);
    if (classValue && classValue !== "all") params.set("classId", classValue);
    if (page > 1) params.set("page", page.toString());
    
    router.push(`/dashboard/students?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(search);
  };

  const formatPhone = (student: Student) => {
    return student.customPhone || student.portalPhone || "—";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc mã SV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>

        <Select value={classFilter} onValueChange={(value) => {
          setClassFilter(value);
          updateFilters(undefined, value);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Lớp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lớp</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.classStudentId} value={cls.classStudentId}>
                {cls.classStudentId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ExportDialog classId={classFilter} search={search} />

        <div className="text-sm text-slate-500 ml-auto">
          Tổng: <strong>{pagination.total}</strong> sinh viên
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Sinh viên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Chuyên ngành</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  Không tìm thấy sinh viên nào
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={student.fileImage ? `https://portal-api.dlu.edu.vn${student.fileImage}` : ""} 
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-900">{student.fullName}</div>
                      <div className="text-sm text-slate-500">{student.studentId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.classStudentId || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {student.specialtyName || "Chưa chọn"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.studyStatusName === "Còn học" ? "default" : "secondary"}
                      className={
                        student.studyStatusName === "Còn học"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : ""
                      }
                    >
                      {student.studyStatusName || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Phone className="h-3 w-3" />
                      {formatPhone(student)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/students/${student.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Xem
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Trang {pagination.page} / {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters(undefined, undefined, pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters(undefined, undefined, pagination.page + 1)}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
