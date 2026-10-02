"use client";
import { Suspense } from "react";
import { useProfileViewModel } from "./useProfileViewModel";
import { ProfileView } from "./ProfileView";

// หน้าโปรไฟล์ (เชื่อม LINE) — อยู่นอก /owner เพราะลูกค้าก็ใช้ได้ (ไม่ผ่าน OwnerLayout/สิทธิ์เมนู)
// path นี้ต้องตรงกับ LINE_LINK_RETURN_URL ของ backend (ดู constants/auth.ts PROFILE_PATH)
function Profile() {
  const vm = useProfileViewModel();
  return <ProfileView {...vm} />;
}

// useSearchParams (อ่าน ?line=) ต้องอยู่ใต้ Suspense ไม่งั้น build prerender ไม่ผ่าน
export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
