/**
 * Sync Service
 * Handles data synchronization from Portal to local database
 */

import prisma from "@/lib/prisma";
import {
  authenticate,
  getStudentsInClass,
  getStudentInfo,
  type PortalStudentDetail,
} from "@/lib/portal-api";
import {
  parsePortalDate,
  extractSpecialty,
  generateSchoolEmail,
  delay,
} from "@/lib/utils";

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors: string[];
  syncLogId?: string;
}

/**
 * Transform Portal student data to our database format
 */
function transformStudentData(raw: PortalStudentDetail) {
  const specialty = extractSpecialty(raw.StudyProgramID);

  return {
    studentId: raw.StudentID,
    lastName: raw.LastName || "",
    firstName: raw.FirstName || "",
    fullName: raw.StudentName || "",
    birthday: parsePortalDate(raw.Birthday),
    birthPlace: raw.BirthPlace,
    gender: raw.Gender,
    ethnicName: raw.EthnicName,
    religionName: raw.ReligionName,
    idCard: raw.IDCard,
    fileImage: raw.FileImage,
    courseId: raw.CourseID,
    courseName: raw.CourseName,
    departmentId: raw.DepartmentID,
    departmentName: raw.DepartmentName,
    ologyId: raw.OlogyID,
    ologyName: raw.OlogyName,
    classStudentId: raw.ClassStudentID,
    studyStatusId: raw.StudyStatusID,
    studyStatusName: raw.StudyStatusName,
    studyProgramId: raw.StudyProgramID,
    specialtyCode: specialty.code,
    specialtyName: specialty.name,
    enrollYear: raw.EnrollYear,
    portalPhone: raw.MobilePhone || raw.HomePhone,
    portalEmail: raw.Email,
    portalAddress: raw.ContactAddress,
    fatherName: raw.FatherName,
    motherName: raw.MotherName,
    contactPersonName: raw.ContactPersonName,
    contactPersonPhone: raw.ContactPersonPhone,
    schoolEmail: generateSchoolEmail(raw.StudentID),
    lastSyncedAt: new Date(),
    syncSource: "portal",
  };
}

/**
 * Sync a single student's data from Portal
 */
export async function syncStudent(
  studentId: string,
  token?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    recordsProcessed: 0,
    recordsFailed: 0,
    errors: [],
  };

  try {
    const authToken = token || (await authenticate());
    const data = await getStudentInfo(studentId, authToken);

    if (!data.obj1 || data.obj1.length === 0) {
      throw new Error("No student data returned from Portal");
    }

    const transformed = transformStudentData(data.obj1[0]);

    // Upsert student - only update portal fields, preserve custom fields
    await prisma.student.upsert({
      where: { studentId },
      create: transformed,
      update: {
        // Only update portal data, not custom fields
        lastName: transformed.lastName,
        firstName: transformed.firstName,
        fullName: transformed.fullName,
        birthday: transformed.birthday,
        birthPlace: transformed.birthPlace,
        gender: transformed.gender,
        ethnicName: transformed.ethnicName,
        religionName: transformed.religionName,
        idCard: transformed.idCard,
        fileImage: transformed.fileImage,
        courseId: transformed.courseId,
        courseName: transformed.courseName,
        departmentId: transformed.departmentId,
        departmentName: transformed.departmentName,
        ologyId: transformed.ologyId,
        ologyName: transformed.ologyName,
        classStudentId: transformed.classStudentId,
        studyStatusId: transformed.studyStatusId,
        studyStatusName: transformed.studyStatusName,
        studyProgramId: transformed.studyProgramId,
        specialtyCode: transformed.specialtyCode,
        specialtyName: transformed.specialtyName,
        enrollYear: transformed.enrollYear,
        portalPhone: transformed.portalPhone,
        portalEmail: transformed.portalEmail,
        portalAddress: transformed.portalAddress,
        fatherName: transformed.fatherName,
        motherName: transformed.motherName,
        contactPersonName: transformed.contactPersonName,
        contactPersonPhone: transformed.contactPersonPhone,
        schoolEmail: transformed.schoolEmail,
        lastSyncedAt: transformed.lastSyncedAt,
        syncSource: transformed.syncSource,
        // NOT updating: customPhone, temporaryAddress, permanentAddress, emergencyContact, emergencyPhone, notes
      },
    });

    result.recordsProcessed = 1;
  } catch (error) {
    result.success = false;
    result.recordsFailed = 1;
    result.errors.push(
      `${studentId}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Sync all students in a class from Portal
 */
export async function syncClass(
  classId: string,
  triggeredBy?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    recordsProcessed: 0,
    recordsFailed: 0,
    errors: [],
  };

  try {
    // 1. Authenticate
    const token = await authenticate();

    // 2. Get student list in class
    const studentList = await getStudentsInClass(classId, token);

    if (!studentList || studentList.length === 0) {
      throw new Error(`No students found in class ${classId}`);
    }

    // 3. Ensure class exists
    await prisma.class.upsert({
      where: { classStudentId: classId },
      create: {
        classStudentId: classId,
        className: classId,
      },
      update: {},
    });

    // 4. Sync each student with rate limiting
    for (const student of studentList) {
      try {
        const studentData = await getStudentInfo(student.StudentID, token);

        if (studentData.obj1 && studentData.obj1.length > 0) {
          const transformed = transformStudentData(studentData.obj1[0]);

          // Get or create class record
          const classRecord = await prisma.class.findUnique({
            where: { classStudentId: classId },
          });

          await prisma.student.upsert({
            where: { studentId: student.StudentID },
            create: {
              ...transformed,
              classId: classRecord?.id,
            },
            update: {
              lastName: transformed.lastName,
              firstName: transformed.firstName,
              fullName: transformed.fullName,
              birthday: transformed.birthday,
              birthPlace: transformed.birthPlace,
              gender: transformed.gender,
              ethnicName: transformed.ethnicName,
              religionName: transformed.religionName,
              idCard: transformed.idCard,
              fileImage: transformed.fileImage,
              courseId: transformed.courseId,
              courseName: transformed.courseName,
              departmentId: transformed.departmentId,
              departmentName: transformed.departmentName,
              ologyId: transformed.ologyId,
              ologyName: transformed.ologyName,
              classStudentId: transformed.classStudentId,
              studyStatusId: transformed.studyStatusId,
              studyStatusName: transformed.studyStatusName,
              studyProgramId: transformed.studyProgramId,
              specialtyCode: transformed.specialtyCode,
              specialtyName: transformed.specialtyName,
              enrollYear: transformed.enrollYear,
              portalPhone: transformed.portalPhone,
              portalEmail: transformed.portalEmail,
              portalAddress: transformed.portalAddress,
              fatherName: transformed.fatherName,
              motherName: transformed.motherName,
              contactPersonName: transformed.contactPersonName,
              contactPersonPhone: transformed.contactPersonPhone,
              schoolEmail: transformed.schoolEmail,
              lastSyncedAt: transformed.lastSyncedAt,
              syncSource: transformed.syncSource,
              classId: classRecord?.id,
            },
          });

          result.recordsProcessed++;
        }

        // Rate limiting: wait 100ms between requests
        await delay(100);
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(
          `${student.StudentID}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    result.success = result.recordsFailed === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // 5. Log sync result
  const syncLog = await prisma.syncLog.create({
    data: {
      syncType: "CLASS_SYNC",
      status: result.success
        ? "SUCCESS"
        : result.recordsProcessed > 0
          ? "PARTIAL"
          : "FAILED",
      message:
        result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      recordsProcessed: result.recordsProcessed,
      recordsFailed: result.recordsFailed,
      targetClassId: classId,
      triggeredBy,
    },
  });

  result.syncLogId = syncLog.id;

  return result;
}

/**
 * Get sync logs with pagination
 */
export async function getSyncLogs(options?: {
  page?: number;
  limit?: number;
  syncType?: string;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const where = options?.syncType ? { syncType: options.syncType } : {};

  const [logs, total] = await Promise.all([
    prisma.syncLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.syncLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
