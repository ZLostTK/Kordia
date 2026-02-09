import defaultImage from "@/Assets/default.webp"

export default function CardSong() {
    return (
        <article className="flex flex-row gap-4 w-full h-22 rounded-lg p-2 bg-gray-100 dark:bg-gray-900">
            <section className="w-20 h-full">
                <img
                    src={defaultImage}
                    alt="default"
                    className="w-full h-full rounded-lg object-cover bg-gray-300 dark:bg-gray-700"
                    draggable="false"
                />
            </section>
            <section className="flex flex-col">
                <h3 className="text-gray-900 dark:text-gray-300 font-bold text-2xl">
                    Titulo
                </h3>
                <p className="text-gray-400 dark:text-gray-400 text-md">
                    Autor
                </p>
            </section>
            <section className="flex items-center justify-end flex-auto p-2">
                <button
                    type="button"
                    className="w-12 h-12 flex items-center justify-center p-2 rounded-full cursor-pointer bg-white dark:bg-gray-800"
                    aria-label="play"
                    title="play"
                >
                    <box-icon name='play-circle' className="fill-gray-600 dark:fill-gray-200 w-8 h-8"></box-icon>
                </button>
            </section>
        </article>
    )
}