'use client';

import { supabase } from "./utils/supabase";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [captions, setCaptions] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaptions = async () => {
      const { data, error } = await supabase
        .from("captions")
        .select(`
          *,
          images (
            url,
            image_description
          )
        `);
      if (error) {
        setError(error.message);
      } else {
        setCaptions(data);
      }
      setLoading(false);
    };

    fetchCaptions();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <h1 className="text-6xl font-extrabold text-pink-600 dark:text-pink-400">
            Loading...
          </h1>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <h1 className="text-6xl font-extrabold text-red-600 dark:text-red-400">
            Error: {error}
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="container mx-auto p-4">
        <h1 className="text-5xl font-extrabold text-pink-600 dark:text-pink-400 mb-8 text-center">
          The Humor Project Captions
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {captions && captions.map((caption) => (
            <div key={caption.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden">
              {caption.images && caption.images.url && (
                <Image
                  src={caption.images.url}
                  alt={caption.images.image_description || "Caption image"}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-gray-800 dark:text-white">{caption.content}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Likes: {caption.like_count}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
