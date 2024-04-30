import { parseWithZod } from '@conform-to/zod'
import {
	type LoaderFunctionArgs,
	json,
	type ActionFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'

export const meta: MetaFunction = () => [{ title: 'Grocery list' }]

const ItemForm = z.object({ name: z.string().min(1) })

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const action = formData.get('_action')

	if (action === 'delete') {
		const deletedItem = await prisma.listItem.update({
			where: { id: String(formData.get('id')) },
			data: { checked: true },
		})
		return json({ item: deletedItem })
	}

	if (action === 'undo') {
		const undoItem = await prisma.listItem.update({
			where: { id: String(formData.get('id')) },
			data: { checked: false },
		})
		return json({ item: undoItem })
	}

	const submission = parseWithZod(formData, { schema: ItemForm })

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: 400 })
	}

	if (action === 'add') {
		const newItem = await prisma.listItem.create({
			data: {
				ownerId: userId,
				name: submission.value.name,
				checked: false,
			},
		})
		console.log({ newItem })
		return json({ item: newItem })
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const groceryList = await prisma.listItem.findMany({
		select: { id: true, name: true, checked: true },
		where: { ownerId: userId },
	})

	return json(groceryList)
}

export default function Index() {
	const fetcher = useFetcher<typeof action>()
	const groceryList = useLoaderData<typeof loader>()
	const formRef = useRef<HTMLFormElement>(null)

	const isSubmitting = fetcher.state !== 'idle' && !!fetcher.data

	useEffect(() => {
		if (isSubmitting) {
			formRef.current?.reset()
		}
	}, [isSubmitting])

	const sortedGroceryList = groceryList.sort((a, b) => {
		const checkedSort = a.checked === b.checked ? 0 : a.checked ? 1 : -1
		const nameSort = a.name.localeCompare(b.name)

		return checkedSort || nameSort
	})

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
							<button name="_action" value="add" disabled={isSubmitting}>
								Add
							</button>
						</li>
					</fetcher.Form>
					{sortedGroceryList.length === 0 ? (
						<div className="bg-secondary-foreground p-10 text-center">
							<p className="pb-3 text-secondary">Your grocery list is empty</p>
							<p className="text-secondary">
								Click the button below to add items to your list
							</p>
						</div>
					) : (
						<div>
							{sortedGroceryList.map(item => (
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
	id: string
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
