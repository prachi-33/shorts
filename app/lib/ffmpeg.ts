import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import https from "https";

let ffmpegConfigured = false;

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = require("fs").createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        require("fs").chmodSync(dest, 0o755);
        resolve();
      });
    }).on("error", (err) => {
      require("fs").unlinkSync(dest);
      reject(err);
    });
  });
}

export async function setupFFmpeg() {
  if (ffmpegConfigured) return;

  // Check if we're on Vercel
  if (process.env.VERCEL) {
    const ffmpegPath = "/tmp/ffmpeg";
    
    try {
      await fs.access(ffmpegPath);
    } catch {
      console.log("Downloading FFmpeg for Vercel...");
      await downloadFile(
        "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-linux-x64",
        ffmpegPath
      );
      console.log("FFmpeg downloaded");
    }
    
    ffmpeg.setFfmpegPath(ffmpegPath);
  }
  // Local development - assumes ffmpeg is in PATH
  
  ffmpegConfigured = true;
}

export default ffmpeg;