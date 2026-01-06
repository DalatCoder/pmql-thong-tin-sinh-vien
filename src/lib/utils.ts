import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse date string from Portal format (DD/MM/YYYY) to Date object
 */
export function parsePortalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  // Handle format: "DD/MM/YYYY"
  const parts = dateString.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Handle ISO format
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Extract specialty code from studyProgramId
 * e.g., "CQ23CT-PM" -> { code: "PM", name: "Kỹ thuật phần mềm" }
 */
export function extractSpecialty(studyProgramId: string | null | undefined): {
  code: string | null;
  name: string | null;
} {
  if (!studyProgramId) return { code: null, name: null };

  const specialtyMap: Record<string, string> = {
    PM: "Kỹ thuật phần mềm",
    MMT: "Mạng máy tính và truyền thông",
  };

  for (const [code, name] of Object.entries(specialtyMap)) {
    if (studyProgramId.endsWith(`-${code}`)) {
      return { code, name };
    }
  }

  return { code: null, name: null };
}

/**
 * Generate school email from student ID
 */
export function generateSchoolEmail(studentId: string): string {
  return `${studentId}@dlu.edu.vn`;
}

/**
 * Delay execution for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
