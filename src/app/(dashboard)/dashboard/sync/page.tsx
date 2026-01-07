import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncForm } from "@/components/features/sync/sync-form";
import { PortalLoginForm } from "@/components/features/sync/portal-login-form";
import { ClassOptionsManager } from "@/components/features/sync/class-options-manager";
import { RefreshCcw, CheckCircle, XCircle, AlertCircle, KeyRound, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

async function getSyncLogs() {
  return prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

async function getClasses() {
  return prisma.class.findMany({
    select: { classStudentId: true },
    orderBy: { classStudentId: "asc" },
  });
}

async function getClassOptions() {
  return prisma.classOption.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { classStudentId: "asc" }],
  });
}

export default async function SyncPage() {
  const [logs, classes, classOptions] = await Promise.all([
    getSyncLogs(),
    getClasses(),
    getClassOptions(),
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-700">Thành công</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700">Thất bại</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Một phần</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Đồng bộ Dữ liệu</h2>
        <p className="text-slate-500">Đồng bộ thông tin sinh viên từ Portal DLU</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portal Login */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Kết nối Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PortalLoginForm />
          </CardContent>
        </Card>

        {/* Sync form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Thực hiện đồng bộ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SyncForm classes={classes} classOptions={classOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Quản lý lớp đồng bộ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quản lý lớp đồng bộ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClassOptionsManager classOptions={classOptions} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>
            <strong>1. Kết nối Portal:</strong> Đăng nhập bằng tài khoản Portal (mã giảng viên và mật khẩu). 
            Token sẽ được lưu và có hiệu lực trong 2 giờ.
          </p>
          <p>
            <strong>2. Đồng bộ theo lớp:</strong> Chọn lớp cần đồng bộ từ danh sách. 
            Hệ thống sẽ lấy danh sách sinh viên trong lớp và cập nhật thông tin từ Portal.
          </p>
          <p>
            <strong>3. Đồng bộ theo mã SV:</strong> Nhập mã số sinh viên cần đồng bộ. 
            Dùng để cập nhật nhanh 1 sinh viên cụ thể.
          </p>
          <p className="text-amber-600">
            <strong>Lưu ý:</strong> Thông tin bổ sung (SĐT cập nhật, địa chỉ tạm trú, ghi chú...) 
            sẽ được giữ nguyên, không bị ghi đè khi đồng bộ.
          </p>
        </CardContent>
      </Card>

      {/* Sync logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lịch sử đồng bộ</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Chưa có lịch sử đồng bộ
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">
                        {log.syncType === "CLASS_SYNC" ? "Đồng bộ lớp" : "Đồng bộ sinh viên"}
                        {log.targetClassId && (
                          <Badge variant="outline" className="ml-2">
                            {log.targetClassId}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <div className="text-green-600">+{log.recordsProcessed} thành công</div>
                      {log.recordsFailed > 0 && (
                        <div className="text-red-600">-{log.recordsFailed} thất bại</div>
                      )}
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
