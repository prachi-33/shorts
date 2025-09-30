"use server"
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient } from "@supabase/supabase-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVEN_LABS_API_KEY });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

const bucketName = process.env.BUCKET_NAME || "images";

export const generateAudio = async (videoId: string) => {
  try {
    const video = await prisma.video.findUnique({
      where: {
        videoId: videoId
      }
    });

    if (!video || !video.content) {
      return null;
    }

    console.log("In video now");
    
    const audioStream = await client.textToSpeech.convert("nPczCjzI2devNBz1zQrb", {
      text: video.content,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128"
    });

    const chunks: Buffer[] = [];
    
    // Fix: Add proper type casting for the async iterator
    for await (const chunk of audioStream as any) {
      chunks.push(Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);
    console.log("Generated audio, size:", audioBuffer.length, "bytes");

    // Upload to Supabase Storage
    const fileName = `${randomUUID()}.mp3`;
    console.log("Uploading audio file:", fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log("Audio URL:", publicUrl);

    // Update video with audio URL
    await prisma.video.update({
      where: { videoId },
      data: { audio: publicUrl }
    });

    return publicUrl;

  } catch (err) {
    console.error("Error generating audio:", err);
    throw err;
  }
};