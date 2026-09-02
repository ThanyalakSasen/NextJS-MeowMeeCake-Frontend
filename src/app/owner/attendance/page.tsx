"use client";
import { useAttendanceViewModel } from "./useAttendanceViewModel";
import { AttendanceView } from "./AttendanceView";

export default function AttendancePage() {
  const vm = useAttendanceViewModel();
  return <AttendanceView {...vm} />;
}
