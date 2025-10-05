import path from "path";
import { prisma } from "../lib/db";
import fs from "fs";
import ffmpeg, { setupFFmpeg } from "../lib/ffmpeg";
import { createClient } from "@supabase/supabase-js";
import https from "https";
import http from "http";

const downloadFile = (url: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(outputPath);

    protocol
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`Failed to download: ${response.statusCode}`));
        }
      })
      .on("error", (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
};

export const renderVideo = async (videoId: string) => {
  await setupFFmpeg();
  
  const startTime = Date.now();
  const tempDir = path.join("/tmp", `temp_${videoId}`);
  const output = path.join(tempDir, `video_${videoId}.mp4`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });

    const video = await prisma.video.findUnique({
      where: { videoId },
      select: { imageLinks: true, audio: true },
    });

    if (!video?.audio || !video.imageLinks?.length) {
      throw new Error("Video data not found");
    }

    console.log(`🖼️ Processing ${video.imageLinks.length} images with audio...`);

    // Download audio
    const audioPath = path.join(tempDir, `audio_${videoId}.mp3`);
    console.log("🎵 Downloading audio...");
    await downloadFile(video.audio, audioPath);

    // Download images
    const imagePaths: string[] = [];
    console.log("🖼️ Downloading images...");
    for (let i = 0; i < video.imageLinks.length; i++) {
      const imgPath = path.join(tempDir, `image_${String(i).padStart(3, "0")}.jpg`);
      await downloadFile(video.imageLinks[i], imgPath);
      imagePaths.push(imgPath);
      console.log(`✅ Downloaded image ${i + 1}/${video.imageLinks.length}`);
    }

    console.log("🎬 Creating video with FFmpeg...");
    const imageDuration = 30 / video.imageLinks.length;

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg();

      imagePaths.forEach((imgPath) => {
        cmd = cmd.input(imgPath).inputOptions([
          "-loop", "1",
          "-t", imageDuration.toString(),
        ]);
      });

      cmd = cmd.input(audioPath);

      const filterParts: string[] = [];
      imagePaths.forEach((_, i) => {
        filterParts.push(
          `[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`
        );
      });

      const concatInputs = imagePaths.map((_, i) => `[v${i}]`).join("");
      filterParts.push(`${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[outv]`);

      cmd
        .complexFilter(filterParts.join(";"))
        .outputOptions([
          "-map", "[outv]",
          "-map", `${imagePaths.length}:a`,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "-shortest",
        ])
        .on("start", (cmdLine) => console.log("⚙️ FFmpeg command:", cmdLine))
        .on("progress", (progress) => {
          if (progress.percent)
            process.stdout.write(`\rEncoding: ${progress.percent.toFixed(1)}%`);
        })
        .on("stderr", (line) => {
          if (line.includes("Error")) console.error("FFmpeg stderr:", line);
        })
        .on("end", () => {
          console.log("\n✅ FFmpeg finished encoding");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err.message);
          reject(err);
        })
        .save(output);
    });

    // ✅ Wait for output file to exist
    if (!fs.existsSync(output)) {
      throw new Error(`Output file not created: ${output}`);
    }

    const stats = fs.statSync(output);
    if (stats.size === 0) {
      throw new Error("Output file is empty");
    }

    console.log(`📦 Video ready (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SERVICE_ROLE!
    );

    console.log("☁️ Uploading to Supabase...");

    const { error } = await supabase.storage
      .from("shorts")
      .upload(`shorts/${videoId}.mp4`, fs.readFileSync(output), {
        contentType: "video/mp4",
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("shorts")
      .getPublicUrl(`shorts/${videoId}.mp4`);

    await prisma.video.update({
      where: { videoId },
      data: { videoUrl: publicUrl },
    });

    console.log("✅ Uploaded:", publicUrl);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Total processing time: ${totalTime}s`);

    return publicUrl;
  } catch (err: any) {
    console.error("❌ Error in renderVideo:", err.message);
    throw err;
  } finally {
    // Clean up only AFTER upload
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Cleanup error:", cleanupErr);
    }
  }
};
