/**
 * Portal DLU API Client
 * Handles authentication and data fetching from the university portal
 */

import { cookies } from "next/headers";

const PORTAL_BASE_URL = "https://portal-api.dlu.edu.vn/api";
const PORTAL_API_KEY = process.env.PORTAL_API_KEY!;
const PORTAL_CLIENT_ID = process.env.PORTAL_CLIENT_ID || "vhu";
const PORTAL_TOKEN_COOKIE = "portal_token";

interface PortalStudentListItem {
  StudentID: string;
  StudentName: string;
  // ... other fields from the list
}

interface PortalStudentInfo {
  obj1: PortalStudentDetail[];
  obj2: PortalStudentContact[];
}

interface PortalStudentDetail {
  StudentID: string;
  PW: string;
  LastName: string;
  MiddleName: string;
  FirstName: string;
  StudentName: string;
  StudentNameWithID: string;
  FileImage: string | null;
  Birthday: string | null;
  BirthPlace: string | null;
  Gender: boolean;
  Genders: string;
  EthnicID: string | null;
  EthnicName: string | null;
  ReligionID: string | null;
  ReligionName: string | null;
  DchiTTru: string | null;
  PermanentResidence: string | null;
  CountryID: string | null;
  CountryName: string | null;
  ProvinceID: string | null;
  ProvinceName: string | null;
  DistrictID: string | null;
  DistrictName: string | null;
  IDCard: string | null;
  Party: number | null;
  PartyDate: string | null;
  HomePhone: string | null;
  MobilePhone: string | null;
  Email: string | null;
  Email_2: string | null;
  ContactAddress: string | null;
  FatherName: string | null;
  MotherName: string | null;
  ContactPersonName: string | null;
  ContactPersonPhone: string | null;
  CourseID: string | null;
  CourseName: string | null;
  DepartmentID: string | null;
  DepartmentName: string | null;
  OlogyID: string | null;
  OlogyName: string | null;
  ClassStudentID: string | null;
  ClassStudentName: string | null;
  StudyStatusID: string | null;
  StudyStatusName: string | null;
  StudyProgramID: string | null;
  StudyProgramName: string | null;
  EnrollYear: number | null;
  StudyYears: number | null;
  CourseTime: string | null;
}

interface PortalStudentContact {
  StudentID: string;
  StudentName: string;
  ProfessorID: string | null;
  ProfessorName: string | null;
  Pro_MobilePhone: string | null;
  Pro_Email: string | null;
  StudentPhone: string | null;
  StudentMobile: string | null;
  StudentEmail: string | null;
  StudentContactAddress: string | null;
  ContactPersonPhone: string | null;
  ContactPersonName: string | null;
  ClassStudentName: string | null;
}

/**
 * Get Bearer token from cookie (đã đăng nhập Portal)
 */
export async function getPortalToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PORTAL_TOKEN_COOKIE)?.value || null;
}

/**
 * Get list of students in a class (for CVHT)
 */
export async function getStudentsInClass(
  classId: string,
  token: string
): Promise<PortalStudentListItem[]> {
  const response = await fetch(
    `${PORTAL_BASE_URL}/professor/GetStudentInClassCVHT`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Apikey: PORTAL_API_KEY,
        Clientid: PORTAL_CLIENT_ID,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ Id: classId }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get students in class: ${response.status} - ${text}`);
  }

  return response.json();
}

/**
 * Get detailed information of a student
 */
export async function getStudentInfo(
  studentId: string,
  token: string
): Promise<PortalStudentInfo> {
  const response = await fetch(`${PORTAL_BASE_URL}/professor/StudentInfo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: PORTAL_API_KEY,
      clientid: PORTAL_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ p1: studentId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get student info: ${response.status} - ${text}`);
  }

  return response.json();
}

export type {
  PortalStudentInfo,
  PortalStudentDetail,
  PortalStudentContact,
  PortalStudentListItem,
};
