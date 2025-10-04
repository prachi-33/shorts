import { LoaderOne, LoaderTwo } from '@/components/ui/loader'

export default function Loading() {
    return (
        <div className='fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50'>
            <LoaderOne />
        </div>
    )
}