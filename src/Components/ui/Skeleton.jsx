export default function Skeleton({ type }) {
    const types = {
        "playlist": "w-60 h-60",
        "song": "w-full h-22",
    }

    return (
        <div className={`relative rounded-lg bg-gray-100 dark:bg-gray-700 ${types[type]}`}>
            {type === "playlist" && (
                <>
                    <div className="w-full h-full rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                    <div className="absolute top-0 right-0 rounded-md px-4 py-1 mt-2 mr-2 bg-gray-400 dark:bg-gray-900 w-18 h-8 animate-pulse"></div>
                </>
            ) || type === "song" && (
                <>
                    <div className="flex flex-row gap-4 w-full h-22 rounded-lg p-2 bg-gray-100 dark:bg-gray-900">
                        <div className="w-20 h-full">
                            <div className="w-full h-full rounded-lg object-cover bg-gray-300 dark:bg-gray-700"></div>
                        </div>
                        <div>
                            <div className="flex flex-col gap-2">
                                <div className="w-40 h-6 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-15 h-4 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end flex-auto p-2">
                            <div className="w-12 h-12 flex items-center justify-center p-2 rounded-full cursor-pointer bg-gray-300 dark:bg-gray-800 animate-pulse"></div>
                        </div>
                    </div>
                </>
            )}
        </div >
    )
}