import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const CancelPage = () => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center space-y-8 max-w-md">
                <div className="flex justify-center">
                    <XCircle className="h-16 w-16 text-red-500 animate-pulse drop-shadow-lg" />
                </div>
                <div className="relative">
                    <img
                        src="https://th.bing.com/th/id/OIP.xdJzOaRGGFOK18NAtHvZ8wHaHa?w=162&h=180&c=7&r=0&o=7&cb=12&dpr=1.3&pid=1.7&rm=3"
                        alt="Please pay"
                        className="w-full rounded-lg border-4 border-gray-600 shadow-2xl"
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-white">
                        Payment Cancelled 💔
                    </h1>
                    <p className="text-gray-300 text-lg">
                        No worries! You can try again .
                    </p>
                </div>

                <Link href='/dashboard'>
                    <Button className="bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] to-[#1C2D70] font-medium flex items-center gap-2 justify-center w-48 mx-auto py-3 cursor-pointer">
                        Go to Dashboard
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>

            </div>
        </div>
    )
}

export default CancelPage