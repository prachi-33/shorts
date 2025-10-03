"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SignInButton , SignUpButton,UserButton} from '@clerk/nextjs'
import Link from 'next/link'
import { BackgroundLines } from "@/components/ui/background-lines";
import { PlaceholdersAndVanishInput } from "../../components/ui/placeholders-and-vanish-input";
import { NeonGradientCard } from "../../components/ui/neon-gradient-card"
import TooltipCredits from '../componets/creditsButton'
import { useRouter } from 'next/navigation'
import { createVideo } from '../actions/create'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Loader Imports
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { IconSquareRoundedX } from "@tabler/icons-react";

const loadingStates = [
  { text: "Generating script and image prompts" },
  { text: "Generating Images" },
  { text: "Generating audio" },
  { text: "Generating Captions" },
  { text: "Integrating video + audio + captions" },
  { text: "Rendering Frames" },
  { text: "Almost Complete ...... Please Wait" },
  { text: "Uploading ....." },
];

function CreateProject({user,credits}:{user: string | null,credits:number}) {
  const [prompt,setPrompt]=useState("");
  const [showLoginDialog,setShowLoginDialog]=useState(false);
  const [showCreditsDialog,setShowCreditsDialog]=useState(false);
  const [loading,setLoading]=useState(false);   // loader state
  const router=useRouter();
  const placeholders = [
    "3 simple coding tricks for JavaScript",
    "How to take perfect smartphone photos",
    "Learn a magic trick in 30 seconds",
    "Budget travel tips for Europe",
    "Easy yoga stretch for back pain"
  ];
  
  return (
    <div className=' bg-black w-screen h-screen flex flex-col relative'>
        {
            !user && 
            <div className='flex justify-end gap-1 mr-7 mt-5'>
            <SignInButton>
            <Button className="bg-gray-800 border-white border-1 text-white rounded-full mx-2 hover:opacity-80 transition-colors duration-150 cursor-pointer">
                Sign-In
            </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer">
                Sign-Up
            </Button>
            </SignUpButton>
            </div>
        }
        {
          user &&
          <div className='flex justify-end mr-7 mt-5 gap-1'>
            <TooltipCredits credits={credits}/>
            <Link href={"/dashboard"}>
                <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer">
                  Dashhboard
                </Button>
            </Link>
            <UserButton/>
          </div>
        }

        {/* Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100]">
            <Loader loadingStates={loadingStates} loading={loading} duration={60000} />
            <button
              className="fixed top-4 right-4 text-white z-[120]"
              onClick={() => setLoading(false)}
            >
              <IconSquareRoundedX className="h-10 w-10" />
            </button>
          </div>
        )}

        <BackgroundLines className="pointer-events-none flex items-center justify-start w-full flex-col px-4 pt-20">
          <h2 className=" bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
            Create Video in Seconds <br /> AI Does It All
          </h2>
          <p className=" max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
            Transform long prompts into amazing  short YouTube, Facebook and
            Instagram videos with AI — captions, cuts, and edits done automatically.
          </p>
          <div className="mt-10 z-10 pointer-events-auto">
          <NeonGradientCard className=" w-150 items-center justify-center text-center p-0">
          <PlaceholdersAndVanishInput
              placeholders={placeholders}
              onChange={(e)=>{setPrompt(e.target.value)}}
              onSubmit={(e)=>{
                e.preventDefault();
                if(!user){
                  return (setTimeout(()=>setShowLoginDialog(true),1000));
                }
                if(user && credits<1){
                  return (setTimeout(()=>setShowCreditsDialog(true),1000));
                }
                
                // Trigger loader
                setLoading(true);
                createVideo(prompt);

                // Simulate 5 min wait before redirect
                setTimeout(()=>{
                  setLoading(false);
                  router.push("/video/id");
                },300000);
              }}
            />
          </NeonGradientCard>
          </div>

          {/* Login Dialog */}
          <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Hello there!</DialogTitle>
                <DialogDescription>Please sign in to create video!!</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <SignInButton>
                  <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer"
                  onClick={()=>{setShowLoginDialog(false)}}
                  >
                    Sign-In
                  </Button>
                </SignInButton>
                <SignUpButton>
                  <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer"
                  onClick={()=>{setShowLoginDialog(false)}}
                  >
                    Sign-up
                  </Button>
                </SignUpButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Credits Dialog */}
          <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Out of Credits</DialogTitle>
                <DialogDescription>Please add some credits to create video!!</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer"
                  onClick={()=>{
                    router.push("/pricing")
                    setShowCreditsDialog(false)
                  }}
                  >
                    Go To Pricing
                  </Button>
                  <Button className="bg-gradient-to-br hover:opacity-80 text-white  rounded-full mx-2  from-[#3352CC] to-[#1C2D70] font-medium cursor-pointer"
                  onClick={()=>{setShowCreditsDialog(false)}}
                  >
                    Close
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </BackgroundLines>
    </div>
  )
}

export default CreateProject
