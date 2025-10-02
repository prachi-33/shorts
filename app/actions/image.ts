"use server"
import { prisma } from "../lib/db";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import axios from "axios";

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SERVICE_ROLE|| ""
);

const bucketName = process.env.BUCKET_NAME || "images";

// Generate image via ClipDrop and upload to Supabase Storage
const processImage = async (prompt: string) => {
  try {
    // 1️⃣ Generate image from ClipDrop
    const form = new FormData();
    form.append("prompt", prompt);

    const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", form, {
      headers: { "x-api-key": process.env.CLIPDROP_API! },
      responseType: "arraybuffer",
    });

    if (!data) throw new Error("ClipDrop API returned no data");

    const buffer = Buffer.from(data);

    // 2️⃣ Upload to Supabase Storage using native client
    const fileName = `${randomUUID()}.png`;

    const { data: uploadData, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    // 3️⃣ Return public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error("Image process error", err);
    throw err;
  }
};

// Generate image for a video
export const generateImage = async (videoId: string) => {
  try {
    /* const video = await prisma.video.findUnique({ where: { videoId } });
    if (!video) return null;

    console.log("Generating image...");
    const images = video.imagePrompts.map(img=> processImage(img))
    const imageLinks= await Promise.all(images) */
    const imageLinks=[
      'https://isevxkayrpawlqqdumjg.supabase.co/storage/v1/object/public/shorts/d788508b-e378-4009-a21f-b578918c4285.png',
      'https://isevxkayrpawlqqdumjg.supabase.co/storage/v1/object/public/shorts/110d29b7-1e89-4772-b676-2ebf0935895f.png',
      'https://isevxkayrpawlqqdumjg.supabase.co/storage/v1/object/public/shorts/dddc55b1-2530-4392-9fcb-b4e410d546c0.png',
      'https://isevxkayrpawlqqdumjg.supabase.co/storage/v1/object/public/shorts/adc768ca-f770-40b0-b10f-50e845e92a68.png',
      'https://isevxkayrpawlqqdumjg.supabase.co/storage/v1/object/public/shorts/e05cdb3a-7b57-4c6f-b620-32268ff65a43.png'
    ]
    console.log(imageLinks)
    


     await prisma.video.update({
        where:{
            videoId:videoId
        },
        data:{
            imageLinks:imageLinks,
            thumbnail:imageLinks[0]
        }
    }) 
    return imageLinks;
  } catch (err) {
    console.error("Error generating image", err);
    throw err;
  }
};