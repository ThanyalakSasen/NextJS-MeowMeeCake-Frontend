"use client";
// ─────────────────────────────────────────────────────────────
// FormPageLayout — โครงหน้าฟอร์มเต็มหน้า (เพิ่ม/แก้ไข พนักงาน · สินค้า)
//
// เดิม 4 หน้าฟอร์มเขียน markup เดียวกันซ้ำกันเอง (CONSISTENCY_AUDIT ข้อ 3.11):
//   <div className="flex flex-col gap-5"><h1 …>…</h1> … <div className="flex gap-2 mt-4">ปุ่ม</div></div>
// อยากขยับระยะหรือย้ายแถบปุ่มไปติดขอบล่าง ต้องแก้ 4 ที่ — ตอนนี้แก้ที่เดียว
//
// ต่างจาก ListPageLayout / DashboardPageLayout / TabbedPageLayout ตรงที่หน้าฟอร์มไม่มี
// toolbar และไม่มีคำอธิบายใต้หัวข้อ — มีแค่หัวข้อ · เนื้อฟอร์ม · แถวปุ่มท้ายฟอร์ม
//
// แยก FormActions ออกมาเพราะปุ่มต้องอยู่ "ข้างใน" <Form> (SaveButton ใช้ htmlType="submit"
// ถ้าย้ายออกนอกฟอร์ม การกด Enter และการ validate ของ antd จะไม่ทำงาน):
//
//   <FormPageLayout title={t("nav.productsAdd")}>
//     <Form layout="vertical" …>
//       <ProductFormFields />
//       <FormActions>
//         <SaveButton type="primary" htmlType="submit" loading={vm.submitting} />
//         <CancelButton onClick={vm.onCancel} />
//       </FormActions>
//     </Form>
//   </FormPageLayout>
// ─────────────────────────────────────────────────────────────

export function FormPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-medium text-brown-900">{title}</h1>
      {children}
    </div>
  );
}

/** แถวปุ่มท้ายฟอร์ม — ต้องวางไว้ใน <Form> เสมอ (ดูเหตุผลหัวไฟล์) */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex gap-2">{children}</div>;
}
