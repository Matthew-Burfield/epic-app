import { cn } from '#app/utils/misc'

export default function Colors() {
	return (
		<main className="flex flex-wrap gap-3">
			<ColorSwatch color="background" />
			<ColorSwatch color="foreground" />
			<ColorSwatch color="card" />
			<ColorSwatch color="card-foreground" />
			<ColorSwatch color="popover" />
			<ColorSwatch color="popover-foreground" />
			<ColorSwatch color="primary" />
			<ColorSwatch color="primary-foreground" />
			<ColorSwatch color="secondary" />
			<ColorSwatch color="secondary-foreground" />
			<ColorSwatch color="muted" />
			<ColorSwatch color="muted-foreground" />
			<ColorSwatch color="accent" />
			<ColorSwatch color="accent-foreground" />
			<ColorSwatch color="destructive" />
			<ColorSwatch color="destructive-foreground" />
			<ColorSwatch color="border" />
			<ColorSwatch color="input" />
			<ColorSwatch color="ring" />
		</main>
	)
}

function ColorSwatch({ color }: { color: string }) {
	const cssColor = color.includes('foreground')
		? `text-${color}`
		: `bg-${color}`
	return (
		<div className={`h-20 w-20 rounded ${cssColor} p-10 text-2xl`}>{color}</div>
	)
}
