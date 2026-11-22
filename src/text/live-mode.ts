/** Live (real models) is the default; `?sim=true` plays the offline simulator. The sources are chosen when the page loads, so switching reloads it. */
export const isLiveMode = () => new URLSearchParams(location.search).get("sim") !== "true"

export function bindModeToggle(toggle: HTMLButtonElement, isLive: boolean) {
  toggle.setAttribute("aria-pressed", `${isLive}`)
  toggle.querySelector("b")!.textContent = isLive ? "live" : "demo"
  toggle.addEventListener("click", () => {
    const url = new URL(location.href)
    if (isLive) url.searchParams.set("sim", "true")
    else url.searchParams.delete("sim")
    location.assign(url)
  })
}
