/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// Firebase
import { firebasedb } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

interface User {
  id: string;
  fullname: string | null;
  email: string;
  gender: string | null;
  user_image_url: string | null;
}

interface Food {
  id: string;
  foodname: string | null;
  meal: string | null;
  fooddate_at: string | null;
  food_image_url: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // ✅ ดึงข้อมูลผู้ใช้
        const userRef = doc(firebasedb, "user", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ id: userSnap.id, ...userSnap.data() } as User);
        }

        // ✅ ดึงข้อมูลอาหาร (ไม่ใช้ orderBy ก่อน เพื่อทดสอบว่า where ทำงานไหม)
        const q = query(
          collection(firebasedb, "food"),
          where("user_id", "==", userId)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const foodList = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Food[];

          setFoods(foodList);
        } else {
          console.warn("No food data found for this user");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) =>
      f.foodname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [foods, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?")) return;

    try {
      const foodItem = foods.find((f) => f.id === id);

      // ลบรูปใน supabase bucket
      if (foodItem?.food_image_url) {
        const urlParts = foodItem.food_image_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from("food_bk").remove([fileName]);
        }
      }

      // ลบข้อมูลใน Firestore
      await deleteDoc(doc(firebasedb, "food", id));

      // อัปเดต state
      setFoods((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-400">Dashboard</h1>
        {user && (
          <div className="relative">
            <img
              src={
                user.user_image_url ||
                "https://placehold.co/60x60/000000/FFFFFF?text=User"
              }
              alt="Profile"
              className="w-14 h-14 rounded-full border-2 border-blue-400 cursor-pointer"
              onClick={() => setShowProfile(true)}
            />
          </div>
        )}
      </div>

      {/* Profile Popup */}
      {showProfile && user && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-slate-900 p-8 rounded-xl w-full max-w-sm text-center shadow-2xl">
            <img
              src={
                user.user_image_url ||
                "https://placehold.co/120x120/000000/FFFFFF?text=User"
              }
              alt="User"
              className="w-24 h-24 mx-auto rounded-full border-2 border-blue-400 mb-4"
            />
            <h2 className="text-xl font-semibold text-blue-400">
              {user.fullname || "ไม่ระบุชื่อ"}
            </h2>
            <p className="text-gray-400 mt-2">{user.email}</p>
            <p className="text-gray-400 mt-1">
              เพศ: {user.gender || "ไม่ระบุ"}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="w-full rounded-full bg-blue-500 py-2 font-semibold hover:bg-blue-600 transition"
              >
                แก้ไขโปรไฟล์
              </button>
              <button
                onClick={handleLogout}
                className="w-full rounded-full bg-red-500 py-2 font-semibold hover:bg-red-600 transition"
              >
                ออกจากระบบ
              </button>
              <button
                onClick={() => setShowProfile(false)}
                className="w-full rounded-full bg-gray-700 py-2 font-semibold hover:bg-gray-600 transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Add */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
        <input
          type="text"
          placeholder="ค้นหาชื่ออาหาร..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 rounded-full border border-gray-700 bg-slate-800 px-6 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <Link href={`/addfood/${user?.id}`}>
          <button className="rounded-full bg-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-600">
            เพิ่มอาหาร
          </button>
        </Link>
      </div>

      {/* Food Table */}
      <div className="mt-8 overflow-x-auto rounded-xl bg-slate-900 p-4 shadow-2xl">
        <table className="min-w-full table-auto text-left">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="px-4 py-3">วันที่</th>
              <th className="px-4 py-3">รูปภาพ</th>
              <th className="px-4 py-3">ชื่ออาหาร</th>
              <th className="px-4 py-3">มื้ออาหาร</th>
              <th className="px-4 py-3 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredFoods.length > 0 ? (
              filteredFoods.map((food) => (
                <tr
                  key={food.id}
                  className="border-b border-gray-800 transition hover:bg-slate-800"
                >
                  <td className="px-4 py-4">{food.fooddate_at || "-"}</td>
                  <td className="px-4 py-4">
                    <img
                      src={
                        food.food_image_url ||
                        "https://placehold.co/100x100/000000/FFFFFF?text=Food"
                      }
                      alt={food.foodname || "Food"}
                      className="w-[50px] h-[50px] rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-4 py-4">{food.foodname || "-"}</td>
                  <td className="px-4 py-4">{food.meal || "-"}</td>
                  <td className="flex justify-center gap-2 px-4 py-4">
                    <button
                      onClick={() =>
                        user && router.push(`/updatefood/${food.id}`)
                      }
                      className="rounded-full bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(food.id)}
                      className="rounded-full bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-gray-400 text-lg"
                >
                  ยังไม่มีข้อมูล โปรดเพิ่มมื้ออาหารของคุณ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
