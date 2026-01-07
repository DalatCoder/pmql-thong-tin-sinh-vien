import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Các trường custom có thể import (không ảnh hưởng dữ liệu Portal)
const IMPORT_COLUMNS = {
  studentId: { label: "Mã SV", required: true, description: "Mã sinh viên (bắt buộc)" },
  fullName: { label: "Họ và tên", required: false, description: "Chỉ để tham khảo, không cập nhật" },
  classStudentId: { label: "Lớp", required: false, description: "Chỉ để tham khảo, không cập nhật" },
  customPhone: { label: "SĐT liên hệ", required: false, description: "Số điện thoại liên hệ cập nhật" },
  temporaryAddress: { label: "Địa chỉ tạm trú", required: false, description: "Địa chỉ tạm trú hiện tại" },
  permanentAddress: { label: "Địa chỉ thường trú", required: false, description: "Địa chỉ thường trú cập nhật" },
  emergencyContact: { label: "Người liên hệ khẩn cấp", required: false, description: "Tên người liên hệ khi khẩn cấp" },
  emergencyPhone: { label: "SĐT khẩn cấp", required: false, description: "Số điện thoại liên hệ khẩn cấp" },
  notes: { label: "Ghi chú", required: false, description: "Ghi chú của giảng viên/cố vấn" },
} as const;

// Các trường sẽ được cập nhật
const UPDATABLE_FIELDS = ["customPhone", "temporaryAddress", "permanentAddress", "emergencyContact", "emergencyPhone", "notes"] as const;

// GET - Tải template mẫu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const withData = searchParams.get("withData") === "true";

  try {
    // Fetch students nếu cần (để điền sẵn mã SV, họ tên, lớp)
    let students: { studentId: string; fullName: string; classStudentId: string | null; customPhone: string | null; temporaryAddress: string | null; permanentAddress: string | null; emergencyContact: string | null; emergencyPhone: string | null; notes: string | null }[] = [];
    
    if (withData) {
      const where: Record<string, unknown> = {};
      if (classId) {
        where.classStudentId = classId;
      }

      students = await prisma.student.findMany({
        where,
        select: {
          studentId: true,
          fullName: true,
          classStudentId: true,
          customPhone: true,
          temporaryAddress: true,
          permanentAddress: true,
          emergencyContact: true,
          emergencyPhone: true,
          notes: true,
        },
        orderBy: [{ classStudentId: "asc" }, { fullName: "asc" }],
      });
    }

    // Tạo header với tên cột tiếng Việt
    const headers = Object.entries(IMPORT_COLUMNS).map(([, config]) => config.label);

    // Tạo data rows
    const dataRows = students.map((s) => [
      s.studentId,
      s.fullName,
      s.classStudentId || "",
      s.customPhone || "",
      s.temporaryAddress || "",
      s.permanentAddress || "",
      s.emergencyContact || "",
      s.emergencyPhone || "",
      s.notes || "",
    ]);

    // Tạo sheet với header
    const worksheetData = [headers, ...dataRows];
    
    // Nếu không có data, thêm 1 dòng mẫu trống
    if (dataRows.length === 0) {
      worksheetData.push(["2312663", "Nguyễn Văn A", "CTK47A", "0987654321", "123 Đường ABC, TP Đà Lạt", "", "Nguyễn Văn B", "0912345678", ""]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 },  // Mã SV
      { wch: 25 },  // Họ và tên
      { wch: 10 },  // Lớp
      { wch: 15 },  // SĐT liên hệ
      { wch: 35 },  // Địa chỉ tạm trú
      { wch: 35 },  // Địa chỉ thường trú
      { wch: 20 },  // Người liên hệ khẩn cấp
      { wch: 15 },  // SĐT khẩn cấp
      { wch: 30 },  // Ghi chú
    ];

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cập nhật thông tin");

    // Thêm sheet hướng dẫn
    const guideData = [
      ["HƯỚNG DẪN SỬ DỤNG"],
      [""],
      ["1. Cột 'Mã SV' là bắt buộc - dùng để xác định sinh viên cần cập nhật"],
      ["2. Cột 'Họ và tên' và 'Lớp' chỉ để tham khảo, không được cập nhật"],
      ["3. Chỉ các cột sau được cập nhật:"],
      ["   - SĐT liên hệ"],
      ["   - Địa chỉ tạm trú"],
      ["   - Địa chỉ thường trú"],
      ["   - Người liên hệ khẩn cấp"],
      ["   - SĐT khẩn cấp"],
      ["   - Ghi chú"],
      [""],
      ["4. Để xóa thông tin, để ô trống hoặc điền 'XÓALÚA'"],
      ["5. Nếu không muốn thay đổi, giữ nguyên giá trị cũ"],
    ];
    const guideSheet = XLSX.utils.aoa_to_sheet(guideData);
    guideSheet["!cols"] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, guideSheet, "Hướng dẫn");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const filename = classId
      ? `template-capnhat-${classId}.xlsx`
      : `template-capnhat-sinhvien.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json(
      { error: "Không thể tạo file template" },
      { status: 500 }
    );
  }
}

// POST - Upload và cập nhật
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn file Excel" },
        { status: 400 }
      );
    }

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: "File không có dữ liệu" },
        { status: 400 }
      );
    }

    // Map header labels to field keys
    const labelToKey: Record<string, string> = {};
    Object.entries(IMPORT_COLUMNS).forEach(([key, config]) => {
      labelToKey[config.label] = key;
    });

    // Process each row
    const results = {
      total: jsonData.length,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      // Tìm mã SV trong row
      const studentIdLabel = IMPORT_COLUMNS.studentId.label;
      const studentId = row[studentIdLabel]?.toString().trim();

      if (!studentId) {
        results.errors.push(`Dòng ${rowNum}: Thiếu mã sinh viên`);
        results.skipped++;
        continue;
      }

      // Tìm sinh viên trong DB
      const student = await prisma.student.findUnique({
        where: { studentId },
        select: { id: true },
      });

      if (!student) {
        results.errors.push(`Dòng ${rowNum}: Không tìm thấy sinh viên ${studentId}`);
        results.skipped++;
        continue;
      }

      // Build update data (chỉ các trường custom)
      const updateData: Record<string, string | null> = {};
      let hasUpdate = false;

      for (const field of UPDATABLE_FIELDS) {
        const label = IMPORT_COLUMNS[field].label;
        const value = row[label];

        if (value !== undefined) {
          const trimmedValue = value?.toString().trim();
          
          // Xử lý xóa dữ liệu
          if (trimmedValue === "" || trimmedValue === "XÓA") {
            updateData[field] = null;
          } else {
            updateData[field] = trimmedValue;
          }
          hasUpdate = true;
        }
      }

      if (!hasUpdate) {
        results.skipped++;
        continue;
      }

      // Update student
      try {
        await prisma.student.update({
          where: { id: student.id },
          data: updateData,
        });
        results.updated++;
      } catch (updateError) {
        results.errors.push(`Dòng ${rowNum}: Lỗi cập nhật sinh viên ${studentId}`);
        results.skipped++;
        console.error(`Update error for ${studentId}:`, updateError);
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      message: `Đã cập nhật ${results.updated}/${results.total} sinh viên`,
      ...results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Không thể xử lý file Excel" },
      { status: 500 }
    );
  }
}
