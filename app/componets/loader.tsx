"use client";
import React, { useState } from "react";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { IconSquareRoundedX } from "@tabler/icons-react";

const loadingStates = [
  {
    text: "Generating script and image prompts",
  },
  {
    text: "Generating Images",
  },
  {
    text: "Generating audio",
  },
  {
    text: "Generating Captions",
  },
  {
    text: "Integrating video + audio + captions",
  },
  {
    text: "Rendering Frames",
  },
  {
    text: "Almost Complete ...... Please Wait",
  },
  {
    text: "Uploading .....",
  },
];

export function MultiStepLoaderDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="w-full h-[60vh] flex items-center justify-center">
      {/* Core Loader Modal */}
      <Loader loadingStates={loadingStates} loading={loading} duration={2000} />

      

      {loading && (
        <button
          className="fixed top-4 right-4 text-black dark:text-white z-[120]"
          onClick={() => setLoading(false)}
        >
          <IconSquareRoundedX className="h-10 w-10" />
        </button>
      )}
    </div>
  );
}
