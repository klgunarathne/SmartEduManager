import { apiClient } from './api-client';
import { StudentDto, AttendanceDto, AttendanceSummary } from '@/models/student.models';

export const studentService = {
  async getByNic(nic: string): Promise<StudentDto> {
    return apiClient.get<StudentDto>(`/Students/by-nic/${encodeURIComponent(nic)}`);
  },

  async getAttendance(studentId: string): Promise<{ attendance: AttendanceDto[]; summary: AttendanceSummary }> {
    const attendance = await apiClient.get<AttendanceDto[]>(`/Attendance/student/${studentId}`);

    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.isPresent).length;
    const absentDays = totalDays - presentDays;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      attendance,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        percentage,
      },
    };
  },
};
