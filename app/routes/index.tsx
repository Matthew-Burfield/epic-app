import { type MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [{ title: 'Grocery list' }]

export default function Index() {
	return (
		<main className="font-poppins grid h-full">
			<div className="grid px-4 xl:grid-cols-2 xl:gap-24">
				<div className="flex max-w-md flex-col items-center gap-5 text-center xl:order-2 xl:items-start xl:text-left">
					<h1
						data-heading
						className="font-poppins animate-slide-top text-2xl font-bold text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] hover:text-accent md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						Grocery list
					</h1>
					<div className="bg-secondary-foreground p-10">
						<p className="pb-3 text-secondary">Your grocery list is empty</p>
						<p className="text-secondary">
							Click the button below to add items to your list
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}
