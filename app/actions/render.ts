import path from "path";
import { prisma } from "../lib/db";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { createClient } from "@supabase/supabase-js";
import https from "https";
import http from "http";

const frameRate = 30;
const durationInSeconds = 30;
const totalFrames = frameRate * durationInSeconds;
const width = 1280;
const height = 720;

interface Caption {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface VideoData {
  imageLinks: string[];
  captions: Caption[];
  audio: string;
  width: number;
  height: number;
}

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

async function takeScreenshotWithRetry(page: any, framePath: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await page.screenshot({ 
        path: framePath, 
        type: "png",
        omitBackground: false
      });
      return;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      console.log(`Screenshot retry ${attempt + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

export const renderVideo = async (videoId: string) => {
  const startTime = Date.now();
  const outDir = path.resolve("/tmp", "frames");
  const tempDir = path.resolve("/tmp", "temp");
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });

  const video = await prisma.video.findUnique({
    where: { videoId },
    select: { imageLinks: true, captions: true, audio: true },
  });

  if (!video?.audio) throw new Error("Video or audio not found");

  console.log("Video data:", {
    imageCount: video.imageLinks?.length,
    audioUrl: video.audio,
  });

  if (!video.imageLinks || video.imageLinks.length === 0) {
    throw new Error("No image links found in video data");
  }

  console.log("Downloading audio...");
  const audioPath = path.join(tempDir, `audio_${videoId}.mp3`);
  await downloadFile(video.audio, audioPath);
  console.log("✅ Audio downloaded");

  const videoData: VideoData = {
    imageLinks: video.imageLinks,
    captions: [],
    audio: audioPath,
    width,
    height,
  };

  const framesPerImage = Math.floor(totalFrames / videoData.imageLinks.length);
  
  console.log(`Total frames: ${totalFrames}`);
  console.log(`Total images: ${videoData.imageLinks.length}`);
  console.log(`Frames per image: ${framesPerImage}`);

  let browser;
  const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isProduction) {
    const puppeteerCore = require("puppeteer-core");
    const chromium = require("@sparticuz/chromium");
    
    browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: { width, height },
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
      protocolTimeout: 300000,
    });
  } else {
    const puppeteer = require("puppeteer");
    
    browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 300000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }

  const page = await browser.newPage();
  await page.setViewport({ width, height });

  const htmlPath = path.join(process.cwd(), "public", "video.html");
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`video.html not found at ${htmlPath}`);
  }

  console.log("Rendering frames...");

  let lastImageIndex = -1;

  for (let frame = 0; frame < totalFrames; frame++) {
    const imageIndex = Math.floor(frame / framesPerImage);
    const safeImageIndex = Math.min(imageIndex, videoData.imageLinks.length - 1);

    if (safeImageIndex !== lastImageIndex) {
      const url = `file://${htmlPath}?frame=${frame}&imageIndex=${safeImageIndex}&data=${encodeURIComponent(
        JSON.stringify(videoData)
      )}`;

      await page.goto(url, { 
        waitUntil: "networkidle0",
        timeout: 30000 
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      await page.evaluate(() => {
        return new Promise((resolve) => {
          const img = document.getElementById("background-image") as HTMLImageElement;
          if (img?.complete && img.naturalHeight !== 0) {
            resolve(true);
          } else if (img) {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
            setTimeout(() => resolve(true), 2000);
          } else {
            resolve(true);
          }
        });
      });

      lastImageIndex = safeImageIndex;
      console.log(`Image ${safeImageIndex + 1}/${videoData.imageLinks.length} (frames ${frame}-${Math.min(frame + framesPerImage - 1, totalFrames - 1)})`);
    }

    if (page.isClosed()) {
      throw new Error("Page was closed unexpectedly");
    }

    const framePath = path.join(
      outDir,
      `frame_${String(frame).padStart(4, "0")}.png`
    );

    await new Promise(resolve => setTimeout(resolve, 30));
    await takeScreenshotWithRetry(page, framePath);

    if (frame % 100 === 0 || frame === totalFrames - 1) {
      console.log(`Progress: ${frame + 1}/${totalFrames} frames (${Math.round((frame / totalFrames) * 100)}%)`);
    }
  }

  await browser.close();

  const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ All frames rendered in ${renderTime}s!`);

  const frameFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
  console.log(`Total frames created: ${frameFiles.length}`);

  if (frameFiles.length === 0) {
    throw new Error("No frames were generated!");
  }

  const output = path.join(tempDir, `video_${videoId}.mp4`);
  console.log("Starting FFmpeg encoding...");

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(path.join(outDir, "frame_%04d.png"))
      .inputFPS(frameRate)
      .input(audioPath)
      .videoCodec("libx264")
      .outputOptions([
        "-pix_fmt yuv420p",
        "-preset veryfast",
        "-crf 23",
        "-movflags +faststart",
      ])
      .audioCodec("aac")
      .audioBitrate("128k")
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

  const encodeTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const stats = fs.statSync(output);
  console.log(`Video file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total time: ${encodeTime}s`);

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

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.rmSync(tempDir, { recursive: true, force: true });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Complete pipeline finished in ${totalTime}s`);

  return publicUrl;
};