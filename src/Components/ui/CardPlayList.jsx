import defaultImage from "@/Assets/default.webp"

export default function CardPlayList() {
    return (
        <article className="relative flex flex-row gap-4 w-60 h-60 rounded-lg bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-0 right-0 rounded-md px-4 py-1 mt-2 mr-2 bg-gray-400 dark:bg-gray-900">
                <span className="text-sm text-gray-900 dark:text-gray-300">Album</span>
            </div>
            <div>
                <img src={defaultImage} alt="Default" className="w-full h-full rounded-lg object-cover bg-gray-300 dark:bg-gray-700" draggable="false" />
            </div>
        </article>
    )
}