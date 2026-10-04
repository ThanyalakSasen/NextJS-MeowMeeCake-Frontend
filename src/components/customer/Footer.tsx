// Footer ของหน้าร้าน — ย้ายมาจาก FrontOffice (components/customer/Footer.tsx)
// ลิงก์ "การจัดส่ง" / "ติดต่อเรา" ซ่อนไว้ก่อน จนกว่าจะย้ายหน้านั้นมา (ข้อมูลร้าน/ฟอร์มติดต่อ backend ยังไม่รองรับ)
import Link from "next/link";
import { FaFacebook } from "react-icons/fa";

const FACEBOOK_URL =
  "https://www.facebook.com/people/%E0%B9%80%E0%B8%AB%E0%B8%A1%E0%B8%B5%E0%B8%A2%E0%B8%A2%E0%B8%A1%E0%B8%B5%E0%B9%80%E0%B8%84%E0%B9%89%E0%B8%81/61554367860480/?locale=th_TH";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-100 text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-gray-900">ช่องทางโซเชียล</h3>
            <a
              className="inline-flex items-center gap-3 text-gray-800 hover:text-blue-600 transition-colors w-fit"
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook className="text-2xl text-blue-600 flex-shrink-0" />
              <span className="text-base font-medium">เหมียวมีเค้ก Meâwmee Cake</span>
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-bold text-gray-900">ที่อยู่ร้าน</h4>
            <p className="text-gray-700 leading-relaxed">อำเภอเมือง จังหวัดหนองคาย, 43000</p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-lg font-bold text-gray-900">เมนู</h4>
            <div className="flex flex-col gap-2">
              <Link href="/customer/product" className="text-gray-700 hover:text-gray-900 hover:underline transition-colors">
                สินค้าทั้งหมด
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center py-6 my-8">
          <h2 className="text-4xl sm:text-6xl font-serif tracking-wider text-gray-800 drop-shadow-sm italic">Meowmee Cake</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-sm text-gray-600">
          <p>© 2026 Meowmee Cake. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
