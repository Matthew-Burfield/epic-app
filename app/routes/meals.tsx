import { useFetcher } from '@remix-run/react'
import { useRef } from 'react'

export function action() {
	return null
}

export default function Meals() {
	const fetcher = useFetcher<typeof action>()
	const formRef = useRef<HTMLFormElement>(null)

	const isSubmitting = fetcher.state !== 'idle' && !!fetcher.data
	return (
		<main className="font-poppins grid h-full">
			<div className="grid px-4 xl:grid-cols-2 xl:gap-24">
				<div className="flex max-w-md flex-col gap-5 xl:order-2 xl:items-start xl:text-left">
					<h1
						data-heading
						className="font-poppins animate-slide-top text-center text-2xl font-bold text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] hover:text-accent md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						Meals
					</h1>
					<ul>
						<fetcher.Form ref={formRef} method="post">
							<li
								className={`flex items-center justify-between border-b border-accent p-3`}
							>
								<input type="text" name="name" placeholder="Add a meal" />
								<button disabled={isSubmitting}>Add</button>
							</li>
						</fetcher.Form>
					</ul>
				</div>
			</div>
		</main>
	)
}
