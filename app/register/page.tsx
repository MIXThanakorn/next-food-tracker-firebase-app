/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import bcrypt from "bcryptjs";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { firebasedb } from "@/lib/firebaseConfig";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | ArrayBuffer | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === "fullName") setFullName(value);
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGender(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    const fileInput = document.getElementById(
      "profileImage"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleReset = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setGender("");
    setProfileImage(null);
    setPreviewImage(null);
    const fileInput = document.getElementById(
      "profileImage"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !gender) {
      alertStyled("กรุณากรอกข้อมูลให้ครบถ้วน", false);
      return;
    }

    setLoading(true);
    try {
      // 🔹 ตรวจสอบว่า email นี้มีใน Firestore แล้วหรือยัง
      const q = query(
        collection(firebasedb, "user"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alertStyled("อีเมลนี้ถูกใช้ไปแล้ว", false);
        setLoading(false);
        return;
      }

      // 🔹 hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔹 อัปโหลดรูปไป Supabase bucket เดิม
      let imageUrl = "";
      if (profileImage) {
        const fileName = `${Date.now()}_${profileImage.name}`;
        const { error: imageError } = await supabase.storage
          .from("user_bk")
          .upload(fileName, profileImage);
        if (imageError) throw imageError;

        const { data: publicUrl } = supabase.storage
          .from("user_bk")
          .getPublicUrl(fileName);
        imageUrl = publicUrl.publicUrl;
      }

      // 🔹 เพิ่มข้อมูลใน Firestore
      await addDoc(collection(firebasedb, "user"), {
        fullname: fullName,
        email: email,
        password: hashedPassword,
        gender: gender,
        user_image_url: imageUrl,
        create_at: new Date(),
        update_at: new Date(),
      });

      alertStyled("บันทึกสำเร็จ!", true, () => {
        window.location.href = "/";
      });
    } catch (error: unknown) {
      let message = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      if (error instanceof Error) message = error.message;
      else if (typeof error === "object" && error !== null) {
        try {
          message = JSON.stringify(error);
        } catch {
          message = String(error);
        }
      } else {
        message = String(error);
      }
      alertStyled(`ไม่สามารถบันทึกได้: ${message}`, false);
    } finally {
      setLoading(false);
    }
  };

  const alertStyled = (
    message: string,
    success: boolean,
    callback?: () => void
  ) => {
    const bgColor = success ? "bg-blue-500" : "bg-red-500";
    const modal = document.createElement("div");
    modal.className = `fixed inset-0 flex items-center justify-center bg-black/60 z-50`;
    modal.innerHTML = `
      <div class='rounded-xl p-6 ${bgColor} text-white shadow-xl text-center w-80'>
        <p class='mb-4 text-lg font-semibold'>${message}</p>
        <button class='mt-2 rounded-full bg-white/20 px-6 py-2 text-white hover:bg-white/30 transition'>OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector("button")?.addEventListener("click", () => {
      modal.remove();
      if (callback) callback();
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-blue-400">
          ลงทะเบียน
        </h1>
        <p className="mb-8 text-center text-gray-400">
          กรุณากรอกข้อมูลเพื่อสร้างบัญชี
        </p>

        <form className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-gray-300">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              id="fullName"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="กรุณากรอกชื่อ-นามสกุล"
              value={fullName}
              onChange={handleInputChange}
            />
          </div>

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
                  // 👁 icon
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
                      d="M3.98 8.223A10.477 10.477 0 001.934 12
                      C3.226 16.338 7.244 19.5 12 19.5c.993 0
                      1.953-.138 2.863-.395M6.228 6.228A10.45
                      10.45 0 0112 4.5c4.756 0 8.773 3.162
                      10.065 7.498a10.523 10.523 0 01-4.293
                      5.774M6.228 6.228L3 3m3.228 3.228l3.65
                      3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65
                      m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // 👁‍🗨 icon
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
                      010-.639C3.423 7.51 7.36 4.5 12
                      4.5c4.638 0 8.573 3.007 9.963
                      7.178.07.207.07.431 0
                      .639C20.577 16.49 16.64 19.5 12
                      19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">เพศ</label>
            <div className="flex space-x-4">
              {["ชาย", "หญิง", "อื่นๆ"].map((g) => (
                <label key={g} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={handleGenderChange}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profileImage" className="block text-gray-300 mb-2">
              รูปโปรไฟล์
            </label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-white file:hover:bg-blue-600"
            />
            {previewImage && (
              <div className="mt-4 relative">
                <img
                  src={previewImage as string}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-0 right-1/2 translate-x-16 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 md:px-10 md:py-4"
            >
              {loading ? "กำลังบันทึก..." : "ลงทะเบียน"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-full bg-slate-700 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500 md:px-10 md:py-4"
            >
              รีเซ็ต
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-gray-400">
          มีบัญชีอยู่แล้วใช่ไหม?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-400 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
