import { parseWithZod } from '@conform-to/zod'
import {
	type ActionFunctionArgs,
	json,
	type MetaFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { z } from 'zod'

export const meta: MetaFunction = () => [{ title: 'Grocery list' }]

let id = 0
function createListItem(name: string) {
	id = id + 1
	return { id, userId: 1, name, checked: false }
}
let list = [
	createListItem('Apples'),
	createListItem('Bananas'),
	createListItem('Oranges'),
]

const ItemForm = z.object({ name: z.string().min(1) })

export async function action({ request }: ActionFunctionArgs) {
	// const userId = await requireUserId(request)
	const formData = await request.formData()
	const action = formData.get('_action')

	if (action === 'delete') {
		const item = list.find(item => item.id === Number(formData.get('id')))
		if (!item) {
			return json({ result: 'Item not found' }, { status: 404 })
		}
		item.checked = true
		return json({ item })
	}

	if (action === 'undo') {
		const item = list.find(item => item.id === Number(formData.get('id')))
		if (!item) {
			return json({ result: 'Item not found' }, { status: 404 })
		}
		item.checked = false
		return json({ item })
	}

	const submission = parseWithZod(formData, { schema: ItemForm })

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	const newItem = createListItem(submission.value.name)
	list = [newItem, ...list]

	return json({ item: newItem })
}

export async function loader() {
	return json({ list })
}

export default function Index() {
	const fetcher = useFetcher<typeof action>()
	const list = useLoaderData<typeof loader>().list
	const formRef = useRef<HTMLFormElement>(null)

	const isSubmitting = fetcher.state !== 'idle' && !!fetcher.data
	const newItem =
		fetcher.state !== 'idle' && fetcher.data && 'item' in fetcher.data
			? fetcher.data.item
			: null

	useEffect(() => {
		if (isSubmitting) {
			formRef.current?.reset()
		}
	}, [isSubmitting])

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
					<fetcher.Form ref={formRef} method="post">
						<li
							className={`flex items-center justify-between border-b border-accent p-3`}
						>
							<input type="text" name="name" placeholder="Add an item" />
							<button disabled={isSubmitting}>Add</button>
						</li>
					</fetcher.Form>
					{list.length === 0 ? (
						<div className="bg-secondary-foreground p-10 text-center">
							<p className="pb-3 text-secondary">Your grocery list is empty</p>
							<p className="text-secondary">
								Click the button below to add items to your list
							</p>
						</div>
					) : (
						<div>
							{newItem ? (
								<ListItem
									key={newItem.id}
									id={newItem.id}
									name={newItem.name}
									checked={newItem.checked}
								/>
							) : null}
							{list.map(item => (
								<ListItem
									key={item.id}
									id={item.id}
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

function ListItem({
	id,
	name,
	checked,
}: {
	id: number
	name: string
	checked: boolean
}) {
	const fetcher = useFetcher()
	return (
		<fetcher.Form method="post">
			<input type="hidden" name="id" value={id} />
			<li
				className={`flex items-center justify-between border-b border-accent p-3`}
			>
				<span className={`${checked ? 'line-through' : ''}`}>{name}</span>
				{checked ? (
					<button type="submit" name="_action" value="undo">
						undo
					</button>
				) : (
					<button type="submit" name="_action" value="delete">
						X
					</button>
				)}
			</li>
		</fetcher.Form>
	)
}
