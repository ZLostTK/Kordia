import Skeleton from "@/Components/ui/Skeleton"
import { useThemeContext } from "@/Context/ThemeContext"
import "boxicons"

function App() {
  const { setTheme } = useThemeContext()
  return (
    <>
      <Skeleton type="song" />
      <Skeleton type="playlist" />

      <select name="theme" id="theme" onChange={(e) => setTheme(e.target.value)}>
        <option value="" disabled>Theme</option>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </>
  )
}

export default App