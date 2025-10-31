/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { firebasedb } from "@/lib/firebaseConfig";
import { supabase } from "@/lib/supabaseClient";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

interface FoodData {
  id: string;
  foodname: string;
  meal: string;
  fooddate_at: string;
  food_image_url: string | null;
}

export default function UpdateFoodPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.user_id as string;
  const foodId = params.id as string;

  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState("");
  const [foodDate, setFoodDate] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 โหลดข้อมูลจาก Firebase Firestore
  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        const docRef = doc(firebasedb, "food", foodId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as FoodData;
          setFoodName(data.foodname || "");
          setMealType(data.meal || "");
          setFoodDate(data.fooddate_at || "");
          setCurrentImageUrl(data.food_image_url || null);
          setPreviewImage(data.food_image_url || null);
        } else {
          setError("ไม่พบข้อมูลอาหารนี้");
        }
      } catch (err) {
        console.error("Error fetching food data:", err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    if (foodId) fetchFoodData();
  }, [foodId]);

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
    setPreviewImage(currentImageUrl);
    setImageFile(null);
    setError(null);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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

    setSaving(true);

    try {
      let food_image_url = currentImageUrl;

      // 🔹 ถ้ามีการอัปโหลดรูปใหม่
      if (imageFile) {
        // ลบรูปเก่าใน Supabase (ถ้ามี)
        if (currentImageUrl) {
          const filePath = currentImageUrl.split("/").slice(-2).join("/");
          await supabase.storage.from("food_bk").remove([filePath]);
        }

        // อัปโหลดรูปใหม่ไป Supabase
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `foods/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("food_bk")
          .upload(filePath, imageFile);

        if (uploadError) throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");

        const { data: publicUrlData } = supabase.storage
          .from("food_bk")
          .getPublicUrl(filePath);

        food_image_url = publicUrlData.publicUrl;
      }

      // 🔹 อัปเดตข้อมูลใน Firestore
      const docRef = doc(firebasedb, "food", foodId);
      await updateDoc(docRef, {
        foodname: foodName,
        meal: mealType,
        fooddate_at: foodDate,
        food_image_url,
        update_at: serverTimestamp(),
      } as Record<string, unknown>);

      alert("อัปเดตข้อมูลเรียบร้อย!");
      router.push(`/dashboard`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 text-2xl">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-4xl font-bold text-blue-400">
          แก้ไขอาหาร
        </h1>
        <p className="mb-8 text-center text-gray-400">
          แก้ไขข้อมูลมื้ออาหารของคุณ
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500 p-3 text-red-400 text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleUpdate}>
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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

          {/* Date */}
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
              disabled={saving}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex-1 rounded-full bg-gray-600 px-8 py-3 font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              รีเซ็ต
            </button>
          </div>

          <div className="text-center">
            <Link
              href={`/dashboard`}
              className="text-gray-400 hover:text-blue-400 transition-colors"
            >
              ← กลับไปหน้า dashboard
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
