import path from "path";
import { prisma } from "../lib/db";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
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
  const startTime = Date.now();
  const tempDir = path.resolve("/tmp", "temp");
  fs.mkdirSync(tempDir, { recursive: true });

  const video = await prisma.video.findUnique({
    where: { videoId },
    select: { imageLinks: true, audio: true },
  });

  if (!video?.audio || !video.imageLinks || video.imageLinks.length === 0) {
    throw new Error("Video data not found");
  }

  console.log(`Processing ${video.imageLinks.length} images with audio`);

  // Download audio
  console.log("Downloading audio...");
  const audioPath = path.join(tempDir, `audio_${videoId}.mp3`);
  await downloadFile(video.audio, audioPath);
  console.log("✅ Audio downloaded");

  // Download all images
  console.log("Downloading images...");
  const imagePaths: string[] = [];
  for (let i = 0; i < video.imageLinks.length; i++) {
    const imgPath = path.join(tempDir, `image_${String(i).padStart(3, "0")}.jpg`);
    await downloadFile(video.imageLinks[i], imgPath);
    imagePaths.push(imgPath);
    console.log(`Downloaded image ${i + 1}/${video.imageLinks.length}`);
  }

  // Create input file list for FFmpeg
  const fileListPath = path.join(tempDir, "filelist.txt");
  const imageDuration = 30 / video.imageLinks.length; // seconds per image
  const fileListContent = imagePaths
    .map((imgPath) => `file '${imgPath}'\nduration ${imageDuration}`)
    .join("\n") + `\nfile '${imagePaths[imagePaths.length - 1]}'`; // repeat last image
  
  fs.writeFileSync(fileListPath, fileListContent);

  const output = path.join(tempDir, `video_${videoId}.mp4`);
  console.log("Creating video with FFmpeg...");

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
        '-pix_fmt yuv420p',
        '-preset veryfast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-shortest'
      ])
      .output(output)
      .on("progress", (progress) => {
        if (progress.percent) {
          process.stdout.write(`\rEncoding: ${progress.percent.toFixed(1)}%`);
        }
      })
      .on("end", () => {
        console.log("\n✅ Video encoding completed");
        resolve();
      })
      .on("error", (err) => {
        console.error("\nFFmpeg error:", err.message);
        reject(err);
      })
      .run();
  });

  const stats = fs.statSync(output);
  console.log(`Video file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Upload to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SERVICE_ROLE!
  );

  console.log("Uploading to Supabase...");

  const { error } = await supabase.storage
    .from("shorts")
    .upload(`shorts/${videoId}.mp4`, fs.readFileSync(output), {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("shorts").getPublicUrl(`shorts/${videoId}.mp4`);

  console.log("✅ Uploaded to Supabase:", publicUrl);

  await prisma.video.update({
    where: { videoId },
    data: { videoUrl: publicUrl }
  });

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Complete pipeline finished in ${totalTime}s`);

  return publicUrl;
};