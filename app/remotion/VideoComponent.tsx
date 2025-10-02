// src/VideoPage.tsx
import React from "react";

interface Caption {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface VideoProps {
  imageLinks: string[];
  audio: string;
  captions: Caption[];
  frame: number; // injected per render
  width: number;
  height: number;
}

export const VideoPage: React.FC<VideoProps> = ({
  imageLinks,
  audio,
  captions,
  frame,
  width,
  height,
}) => {
  const durationInFrames = 300; // 10s @ 30fps
  const framesPerImage = Math.ceil(durationInFrames / imageLinks.length);

  const imgIndex = Math.floor(frame / framesPerImage);
  const currentImage = imageLinks[imgIndex];

  const currentCaption = captions.find(
    (cap) => frame >= cap.startFrame && frame <= cap.endFrame
  );

  return (
    <div
      style={{
        backgroundColor: "black",
        width,
        height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {currentImage && (
        <img
          src={currentImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
          }}
        />
      )}
      {currentCaption && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: width * 0.07,
            fontWeight: "bold",
            fontFamily: "Impact, Arial, sans-serif",
            textShadow: `
              -2px -2px 2px black,
               2px -2px 2px black,
              -2px  2px 2px black,
               2px  2px 2px black
            `,
          }}
        >
          {currentCaption.text}
        </div>
      )}
      {/* audio handled later by ffmpeg */}
    </div>
  );
};
