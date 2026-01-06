/**
 * Portal DLU API Client
 * Handles authentication and data fetching from the university portal
 */

const PORTAL_BASE_URL = "https://portal-api.dlu.edu.vn/api";
const PORTAL_API_KEY = process.env.PORTAL_API_KEY!;
const PORTAL_CLIENT_ID = process.env.PORTAL_CLIENT_ID || "vhu";

interface PortalAuthResponse {
  token: string;
  expiresAt: Date;
}

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

// Token cache
let cachedToken: string | null = null;
let tokenExpiresAt: Date | null = null;

/**
 * Get a valid authentication token from Portal
 */
export async function authenticate(
  username?: string,
  password?: string
): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(`${PORTAL_BASE_URL}/authenticate/authpsc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: PORTAL_API_KEY,
      clientid: PORTAL_CLIENT_ID,
    },
    body: JSON.stringify({
      username: username || "",
      password: password || "",
      type: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Portal authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.token;
  // Token expires in 2 hours, cache for 1.5 hours to be safe
  tokenExpiresAt = new Date(Date.now() + 1.5 * 60 * 60 * 1000);

  return cachedToken!;
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
    throw new Error(`Failed to get students in class: ${response.statusText}`);
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
    throw new Error(`Failed to get student info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Clear the cached token (useful for forcing re-authentication)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = null;
}

export type {
  PortalStudentInfo,
  PortalStudentDetail,
  PortalStudentContact,
  PortalStudentListItem,
};
