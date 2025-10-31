"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { firebasedb } from "@/lib/firebaseConfig";
import { supabase } from "@/lib/supabaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddFoodPage() {
  const router = useRouter();
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState("");
  const [foodDate, setFoodDate] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = event.target;
    switch (id) {
      case "foodName":
        setFoodName(value);
        break;
      case "mealType":
        setMealType(value);
        break;
      case "foodDate":
        setFoodDate(value);
        break;
      default:
        break;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setFoodName("");
    setMealType("");
    setFoodDate("");
    setPreviewImage(null);
    setImageFile(null);
    setError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // ✅ ตรวจสอบข้อมูลก่อนบันทึก
    if (!foodName.trim()) {
      setError("กรุณากรอกชื่ออาหาร");
      return;
    }
    if (!mealType) {
      setError("กรุณาเลือกมื้ออาหาร");
      return;
    }
    if (!foodDate) {
      setError("กรุณาเลือกวันที่");
      return;
    }

    const user_id = localStorage.getItem("userId");
    if (!user_id) {
      setError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      let food_image_url: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user_id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("food_bk")
          .upload(fileName, imageFile);

        if (uploadError) {
          throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");
        }

        const { data: publicUrlData } = supabase.storage
          .from("food_bk")
          .getPublicUrl(fileName);

        food_image_url = publicUrlData.publicUrl;
      }

      // ✅ เพิ่มข้อมูลลงใน Firebase Firestore
      await addDoc(collection(firebasedb, "food"), {
        user_id,
        foodname: foodName,
        meal: mealType,
        fooddate_at: foodDate,
        food_image_url,
        create_at: serverTimestamp(),
        update_at: serverTimestamp(),
      });

      alert("บันทึกข้อมูลมื้ออาหารสำเร็จ!");
      router.push(`/dashboard`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-blue-400">
          เพิ่มอาหาร
        </h1>
        <p className="mb-8 text-center text-gray-400">บันทึกมื้ออาหารของคุณ</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500 p-3 text-red-400 text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSave}>
          {/* Food Name */}
          <div>
            <label htmlFor="foodName" className="block text-gray-300">
              ชื่ออาหาร
            </label>
            <input
              type="text"
              id="foodName"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              placeholder="กรุณากรอกชื่ออาหาร"
              value={foodName}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Meal Type */}
          <div>
            <label htmlFor="mealType" className="block text-gray-300">
              มื้ออาหาร
            </label>
            <select
              id="mealType"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              value={mealType}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="" disabled>
                เลือกประเภทมื้ออาหาร
              </option>
              <option value="breakfast">อาหารเช้า</option>
              <option value="lunch">อาหารกลางวัน</option>
              <option value="dinner">อาหารเย็น</option>
              <option value="snack">ของว่าง</option>
            </select>
          </div>

          {/* Food Image */}
          <div>
            <label htmlFor="foodImage" className="block text-gray-300">
              รูปภาพอาหาร
            </label>
            <input
              type="file"
              id="foodImage"
              accept="image/*"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white file:rounded-md file:border-0 file:bg-blue-500 file:text-white file:transition-colors file:duration-300 hover:file:bg-blue-600 focus:outline-none"
              onChange={handleFileChange}
              disabled={loading}
            />
            {previewImage && (
              <div className="mt-4">
                <img
                  src={previewImage}
                  alt="Food Preview"
                  className="mx-auto h-48 w-48 rounded-xl object-cover shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Food Date */}
          <div>
            <label htmlFor="foodDate" className="block text-gray-300">
              วันที่
            </label>
            <input
              type="date"
              id="foodDate"
              className="mt-1 w-full rounded-md border border-gray-700 bg-slate-800 p-3 text-white focus:border-blue-500 focus:outline-none"
              value={foodDate}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="flex-1 rounded-full bg-gray-600 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              รีเซ็ต
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              ← กลับไปหน้าแดชบอร์ด
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
