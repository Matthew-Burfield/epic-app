import { json, type MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

export const meta: MetaFunction = () => [{ title: 'Grocery list' }]

function createListItem(name: string) {
	return { userId: 1, name, checked: false }
}

export async function loader() {
	const list = [
		createListItem('Apples'),
		createListItem('Bananas'),
		createListItem('Oranges'),
	]

	return json({ list })
}

export default function Index() {
	const data = useLoaderData<typeof loader>()
	return (
		<main className="font-poppins grid h-full">
			<div className="grid px-4 xl:grid-cols-2 xl:gap-24">
				<div className="flex max-w-md flex-col gap-5 xl:order-2 xl:items-start xl:text-left">
					<h1
						data-heading
						className="font-poppins animate-slide-top text-center text-2xl font-bold text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] hover:text-accent md:text-5xl xl:mt-4 xl:animate-slide-left xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
					>
						Grocery list
					</h1>
					{data.list.length === 0 ? (
						<div className="bg-secondary-foreground p-10 text-center">
							<p className="pb-3 text-secondary">Your grocery list is empty</p>
							<p className="text-secondary">
								Click the button below to add items to your list
							</p>
						</div>
					) : (
						<div>
							{data.list.map(item => (
								<ListItem
									key={item.name}
									name={item.name}
									checked={item.checked}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	)
}

function ListItem({ name, checked }: { name: string; checked: boolean }) {
	return (
		<li className="flex items-center justify-between border-b border-accent p-3">
			<span>{name}</span>
			<input type="checkbox" />
		</li>
	)
}
