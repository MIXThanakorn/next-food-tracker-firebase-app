"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { firebasedb } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
  fullname?: string | null;
  email?: string | null;
  password?: string | null;
  gender?: string | null;
  user_image_url?: string | null;
  create_at?: string;
  update_at?: string;
}

interface UpdateData {
  fullname: string;
  email: string;
  gender: string;
  user_image_url: string | null;
  update_at: string;
  password?: string;
  [key: string]: string | null | undefined;
}

export default function ProfilePage() {
  const params = useParams() as Record<string, string>;
  const router = useRouter();

  const [userId, setUserId] = useState<string>("");
  const [fullname, setFullname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImagePath, setOldImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // ✅ helper: แปลง Supabase URL -> file path
  const getFilePathFromUrl = (url: string): string | null => {
    try {
      // Format: https://xxx.supabase.co/storage/v1/object/public/user_bk/filename.jpg
      const parts = url.split("/user_bk/");
      if (parts.length === 2) {
        return parts[1];
      }
      return null;
    } catch {
      return null;
    }
  };

  // ✅ โหลดข้อมูลผู้ใช้จาก Firestore
  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      setLoading(true);
      try {
        const uidFromParams = params.user_id || params.id || null;

        const uid =
          (typeof window !== "undefined" && !uidFromParams
            ? localStorage.getItem("userId")
            : uidFromParams) || "";

        if (!uid) {
          router.replace("/login");
          return;
        }

        setUserId(uid);

        const docRef = doc(firebasedb, "user", uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("ไม่พบข้อมูลผู้ใช้");
          router.replace("/login");
          return;
        }

        const data = docSnap.data() as UserData;
        setFullname(data.fullname || "");
        setEmail(data.email || "");
        setGender(data.gender || "");
        setImagePreview(data.user_image_url || null);

        // เก็บ path ของรูปเก่าไว้
        if (data.user_image_url) {
          const path = getFilePathFromUrl(data.user_image_url);
          setOldImagePath(path);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [params, router]);

  // ✅ เปลี่ยนค่าจาก input
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { id, value } = event.target;
    if (id === "fullname") setFullname(value);
    if (id === "email") setEmail(value);
    if (id === "password") setPassword(value);
    if (id === "gender") setGender(value);
  };

  // ✅ เปลี่ยนรูปภาพใหม่
  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = (): void => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ ลบรูปจาก Supabase + อัปเดต Firestore
  const handleDeleteImage = async (): Promise<void> => {
    if (!window.confirm("คุณต้องการลบรูปโปรไฟล์ใช่หรือไม่?")) return;

    try {
      // ลบจาก Supabase
      if (oldImagePath) {
        const { error } = await supabase.storage
          .from("user_bk")
          .remove([oldImagePath]);

        if (error) {
          console.warn("Error deleting from Supabase:", error);
        } else {
          console.log("✅ ลบรูปจาก Supabase สำเร็จ");
        }
      }

      // อัปเดต Firestore
      const docRef = doc(firebasedb, "user", userId);
      await updateDoc(docRef, { user_image_url: null });

      setImagePreview(null);
      setImageFile(null);
      setOldImagePath(null);
      alert("ลบรูปโปรไฟล์สำเร็จ");
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("ไม่สามารถลบรูปได้");
    }
  };

  // ✅ โหลดข้อมูลใหม่จาก Firestore (รีเซ็ต)
  const handleReset = async (): Promise<void> => {
    if (!window.confirm("คุณต้องการรีเซ็ตข้อมูลกลับไปเป็นค่าเดิมใช่หรือไม่?"))
      return;

    try {
      setLoading(true);
      const docRef = doc(firebasedb, "user", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setFullname(data.fullname || "");
        setEmail(data.email || "");
        setGender(data.gender || "");
        setImagePreview(data.user_image_url || null);
        setPassword("");
        setImageFile(null);

        if (data.user_image_url) {
          const path = getFilePathFromUrl(data.user_image_url);
          setOldImagePath(path);
        }
      }
    } catch (error) {
      console.error("Error resetting:", error);
      alert("เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // ✅ บันทึกข้อมูลผู้ใช้กลับไป Firestore
  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      console.log("🔄 เริ่มบันทึกข้อมูล...");

      let imageUrl: string | null = imagePreview;

      // ถ้ามีการอัปโหลดรูปใหม่
      if (imageFile) {
        console.log("📸 มีรูปใหม่ที่จะอัปโหลด");

        // ลบรูปเก่าออกก่อน (ถ้ามี)
        if (oldImagePath) {
          console.log("🗑️ กำลังลบรูปเก่า:", oldImagePath);
          const { error: deleteError } = await supabase.storage
            .from("user_bk")
            .remove([oldImagePath]);

          if (deleteError) {
            console.warn("⚠️ ไม่สามารถลบรูปเก่าได้:", deleteError);
          } else {
            console.log("✅ ลบรูปเก่าสำเร็จ");
          }
        }

        // อัปโหลดรูปใหม่ไปที่ root ของ bucket user_bk
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        console.log("⬆️ กำลังอัปโหลดรูปใหม่:", fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("user_bk")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("❌ Error uploading:", uploadError);
          throw uploadError;
        }

        console.log("✅ อัปโหลดสำเร็จ:", uploadData);

        // ดึง public URL
        const { data: urlData } = supabase.storage
          .from("user_bk")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        console.log("✅ ได้ URL ใหม่:", imageUrl);
      }

      console.log("💾 กำลังบันทึกลง Firestore...");
      const updateData: UpdateData = {
        fullname,
        email,
        gender,
        user_image_url: imageUrl,
        update_at: new Date().toISOString(),
      };

      if (password) {
        console.log("🔐 มีการเปลี่ยนรหัสผ่าน");
        updateData.password = password;
      }

      const docRef = doc(firebasedb, "user", userId);
      await updateDoc(docRef, updateData);

      console.log("✅ บันทึกสำเร็จ");
      alert("บันทึกข้อมูลสำเร็จ");
      router.push(`/dashboard`);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-xl">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-blue-400">
          แก้ไขข้อมูลส่วนตัว
        </h1>
        <p className="mb-8 text-center text-gray-400">
          ปรับปรุงข้อมูลบัญชีของคุณ
        </p>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-gray-700 bg-slate-800 shadow-lg">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-500">
                  ไม่มีรูป
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <label
                htmlFor="image"
                className="cursor-pointer rounded-full bg-blue-500 px-6 py-2 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                เลือกรูปโปรไฟล์
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="rounded-full bg-red-500 px-6 py-2 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300"
                >
                  ลบรูป
                </button>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="block text-gray-300">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              id="fullname"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="กรุณากรอกชื่อ-นามสกุล"
              value={fullname}
              onChange={handleInputChange}
            />
          </div>

          {/* Email */}
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

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-gray-300">
              เพศ
            </label>
            <select
              id="gender"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              value={gender}
              onChange={handleInputChange}
            >
              <option value="">เลือกเพศ</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-gray-300">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="กรอกเฉพาะต้องการเปลี่ยนรหัสผ่าน"
              value={password}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="w-full rounded-full bg-gray-600 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
