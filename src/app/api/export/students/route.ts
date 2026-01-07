import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Định nghĩa các cột có thể xuất
export const EXPORT_COLUMNS = {
  // Thông tin cơ bản
  studentId: { label: "Mã SV", group: "Cơ bản" },
  fullName: { label: "Họ và tên", group: "Cơ bản" },
  lastName: { label: "Họ", group: "Cơ bản" },
  firstName: { label: "Tên", group: "Cơ bản" },
  gender: { label: "Giới tính", group: "Cơ bản" },
  birthday: { label: "Ngày sinh", group: "Cơ bản" },
  birthPlace: { label: "Nơi sinh", group: "Cơ bản" },
  idCard: { label: "CCCD", group: "Cơ bản" },
  ethnicName: { label: "Dân tộc", group: "Cơ bản" },
  religionName: { label: "Tôn giáo", group: "Cơ bản" },

  // Thông tin học tập
  classStudentId: { label: "Lớp", group: "Học tập" },
  courseName: { label: "Khóa", group: "Học tập" },
  departmentName: { label: "Khoa", group: "Học tập" },
  ologyName: { label: "Ngành", group: "Học tập" },
  specialtyName: { label: "Chuyên ngành", group: "Học tập" },
  studyStatusName: { label: "Trạng thái học", group: "Học tập" },
  enrollYear: { label: "Năm nhập học", group: "Học tập" },

  // Liên hệ
  schoolEmail: { label: "Email trường", group: "Liên hệ" },
  portalEmail: { label: "Email Portal", group: "Liên hệ" },
  portalPhone: { label: "SĐT Portal", group: "Liên hệ" },
  customPhone: { label: "SĐT cập nhật", group: "Liên hệ" },
  portalAddress: { label: "Địa chỉ Portal", group: "Liên hệ" },
  temporaryAddress: { label: "Địa chỉ tạm trú", group: "Liên hệ" },
  permanentAddress: { label: "Địa chỉ thường trú", group: "Liên hệ" },

  // Gia đình
  fatherName: { label: "Tên cha", group: "Gia đình" },
  motherName: { label: "Tên mẹ", group: "Gia đình" },
  contactPersonName: { label: "Người liên hệ", group: "Gia đình" },
  contactPersonPhone: { label: "SĐT người liên hệ", group: "Gia đình" },
  emergencyContact: { label: "Liên hệ khẩn cấp", group: "Gia đình" },
  emergencyPhone: { label: "SĐT khẩn cấp", group: "Gia đình" },

  // Khác
  notes: { label: "Ghi chú", group: "Khác" },
} as const;

export type ExportColumnKey = keyof typeof EXPORT_COLUMNS;

// GET - Lấy danh sách cột có thể xuất
export async function GET() {
  // Nhóm các cột theo group
  const grouped: Record<string, { key: string; label: string }[]> = {};
  
  for (const [key, value] of Object.entries(EXPORT_COLUMNS)) {
    if (!grouped[value.group]) {
      grouped[value.group] = [];
    }
    grouped[value.group].push({ key, label: value.label });
  }

  return NextResponse.json({ columns: EXPORT_COLUMNS, grouped });
}

// POST - Xuất Excel
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { columns, classId, search } = body as {
      columns: ExportColumnKey[];
      classId?: string;
      search?: string;
    };

    if (!columns || columns.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một cột để xuất" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {};
    if (classId) {
      where.classStudentId = classId;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch students with selected columns
    const selectFields: Record<string, boolean> = {};
    columns.forEach((col) => {
      selectFields[col] = true;
    });

    const students = await prisma.student.findMany({
      where,
      select: selectFields,
      orderBy: [{ classStudentId: "asc" }, { fullName: "asc" }],
    });

    // Transform data for Excel
    const excelData = students.map((student) => {
      const row: Record<string, unknown> = {};
      columns.forEach((col) => {
        const value = student[col as keyof typeof student];
        const label = EXPORT_COLUMNS[col].label;

        // Format specific fields
        if (col === "gender") {
          row[label] = value === true ? "Nam" : value === false ? "Nữ" : "";
        } else if (col === "birthday" && value) {
          const dateValue = value as Date;
          row[label] = dateValue.toLocaleDateString ? dateValue.toLocaleDateString("vi-VN") : String(value);
        } else {
          row[label] = value ?? "";
        }
      });
      return row;
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sinh viên");

    // Auto-fit column widths
    const colWidths = columns.map((col) => ({
      wch: Math.max(
        EXPORT_COLUMNS[col].label.length,
        ...excelData.map((row) => String(row[EXPORT_COLUMNS[col].label] || "").length)
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Return file
    const filename = `sinh-vien-${new Date().toISOString().split("T")[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Không thể xuất file Excel" },
      { status: 500 }
    );
  }
}
