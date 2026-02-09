export default function Input() {
    return (
        <section className="flex items-center justify-center gap-2 w-full h-12 bg-gray-100 text-gray-400 dark:bg-gray-900 dark:text-gray-200 rounded-lg py-4 px-2">
            <div className="relative flex items-center justify-center">
                <box-icon
                    name='search-alt'
                    className="fill-gray-400 dark:fill-gray-400 absolute left-2"
                ></box-icon>
            </div>
            <input
                className="w-full h-12 bg-gray-100 text-gray-400 focus:text-gray-900 dark:bg-gray-900 dark:text-white dark:focus:text-white focus:outline-0 py-2 px-8 rounded-lg
                appearance-none [&::-webkit-search-cancel-button]:hidden"
                type="search"
                placeholder="Buscar..."
            />
        </section>
    )
}