"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { firebasedb } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const alertStyled = (message: string, success: boolean) => {
    if (typeof window === "undefined") return;
    const color = success ? "bg-green-600" : "bg-red-600";
    const div = document.createElement("div");
    div.className = `fixed inset-0 flex items-center justify-center z-50`;
    div.innerHTML = `
      <div class='${color} text-white px-10 py-6 rounded-lg shadow-lg text-center space-y-4'>
        <p class='text-lg font-semibold'>${message}</p>
        <button id='okBtn' class='bg-white text-black px-4 py-2 rounded font-semibold hover:bg-gray-200 transition'>OK</button>
      </div>
    `;
    document.body.appendChild(div);
    document
      .getElementById("okBtn")
      ?.addEventListener("click", () => div.remove());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
  };

  // ✅ ตรวจสอบการ Login ด้วย Firestore
  const handleLogin = async () => {
    if (!email || !password) {
      alertStyled("กรุณากรอกอีเมลและรหัสผ่าน", false);
      return;
    }

    try {
      setLoading(true);

      // 🔹 ดึงข้อมูลจาก Firestore ตาม email
      const q = query(
        collection(firebasedb, "user"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alertStyled("ไม่พบบัญชีนี้ในระบบ", false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const storedHash = userData.password as string;
      const isMatch = await bcrypt.compare(password, storedHash);

      if (!isMatch) {
        alertStyled("รหัสผ่านไม่ถูกต้อง", false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("userId", userDoc.id);
      }

      alertStyled("เข้าสู่ระบบสำเร็จ!", true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error) {
      console.error("Login error:", error);
      alertStyled("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-blue-400">
          เข้าสู่ระบบ
        </h1>
        <p className="mb-8 text-center text-gray-400">ยินดีต้อนรับกลับมา!</p>

        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-300">
              อีเมล
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="กรุณากรอกอีเมล"
              value={email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 pr-12 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                placeholder="กรุณากรอกรหัสผ่าน"
                value={password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
              >
                {showPassword ? (
                  // 👁 แสดงรหัสผ่าน
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 
                      7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 
                      6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 
                      10.065 7.498a10.523 10.523 0 01-4.293 
                      5.774M6.228 6.228L3 3m3.228 
                      3.228l3.65 3.65m7.894 
                      7.894L21 21m-3.228-3.228l-3.65-3.65m0 
                      0a3 3 0 10-4.243-4.243m4.242 
                      4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // 🔒 ซ่อนรหัสผ่าน
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 
                      010-.639C3.423 7.51 7.36 4.5 
                      12 4.5c4.638 0 8.573 3.007 
                      9.963 7.178.07.207.07.431 0 
                      .639C20.577 16.49 16.64 19.5 
                      12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 
                      0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 md:px-10 md:py-4"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full rounded-full bg-slate-700 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500 md:px-10 md:py-4"
            >
              กลับหน้าแรก
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-gray-400">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <a
            href="/register"
            className="font-semibold text-blue-400 hover:underline"
          >
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>
  );
}
