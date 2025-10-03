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
    const video = await prisma.video.findUnique({ where: { videoId } });
    if (!video) return null;

    console.log("Generating image...");
    const images = video.imagePrompts.map(img=> processImage(img))
    const imageLinks= await Promise.all(images)
    
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