import { parseWithZod } from '@conform-to/zod'
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import {
	type ComponentPropsWithoutRef,
	Fragment,
	useEffect,
	useRef,
	useState,
} from 'react'
import { z } from 'zod'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card'
import { Checkbox } from '#app/components/ui/checkbox.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { cn } from '#app/utils/misc.js'

export const meta: MetaFunction = () => [{ title: 'Grocery list' }]

const ItemForm = z.object({ name: z.string().min(1) })

export async function action({ request }: ActionFunctionArgs) {
	// const userId = await requireUserId(request)
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
		// const newItem = await prisma.listItem.create({
		// 	data: {
		// 		ownerId: userId,
		// name: submission.value.name,
		// 		checked: false,
		// 	},
		// })
		// console.log({ newItem })
		// return json({ item: newItem })
		return null
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			Meal: {
				select: {
					id: true,
					name: true,
				},
			},
			List: {
				select: {
					id: true,
					name: true,
					ListItem: {
						select: {
							id: true,
							quantity: true,
							checked: true,
							item: {
								select: {
									name: true,
									categoryId: true,
								},
							},
						},
					},
					ListMealItem: {
						select: {
							id: true,
							quantity: true,
							checked: true,
							mealItem: {
								select: {
									item: {
										select: {
											name: true,
											categoryId: true,
										},
									},
									meal: {
										select: {
											id: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	})
	const categories = await prisma.category.findMany({
		select: {
			id: true,
			name: true,
			sort: true,
		},
		orderBy: { sort: 'asc' },
	})

	return json({ user, categories })
}

export default function Index() {
	const fetcher = useFetcher<typeof action>()
	const { user, categories } = useLoaderData<typeof loader>()
	const formRef = useRef<HTMLFormElement>(null)
	const [sortStyle, setSortStyle] = useState<
		'categories' | 'alphabetical' | 'meals'
	>('categories')

	const isSubmitting = fetcher.state !== 'idle' && !!fetcher.data

	console.log({ user, categories })

	useEffect(() => {
		if (isSubmitting) {
			formRef.current?.reset()
		}
	}, [isSubmitting])

	if (!user) {
		return null
	}

	type List = (typeof user.List)[number]

	type Item = List['ListMealItem'][number] | List['ListItem'][number]
	const list = user.List[0]
	const sortedGroceryList = [...list.ListMealItem, ...list.ListItem].sort(
		(a, b) => {
			const checkedSort = a.checked === b.checked ? 0 : a.checked ? 1 : -1
			const aName = 'item' in a ? a.item.name : a.mealItem.item.name
			const bName = 'item' in a ? a.item.name : a.mealItem.item.name
			const nameSort = aName.localeCompare(bName)

			return checkedSort || nameSort
		},
	)

	const mappedGroceryList = sortedGroceryList.reduce(
		(acc, item) => {
			const categoryId =
				'item' in item ? item.item.categoryId : item.mealItem.item.categoryId
			if (!acc[categoryId]) {
				acc[categoryId] = []
			}
			acc[categoryId].push(item)
			return acc
		},
		{} as Record<string, Item[]>,
	)

	return (
		<main>
			<h1
				data-heading
				className="font-poppins animate-slide-top xl:animate-slide-left text-center text-2xl font-bold text-foreground [animation-delay:0.3s] [animation-fill-mode:backwards] hover:text-accent md:text-5xl xl:mt-4 xl:text-6xl xl:[animation-delay:0.8s] xl:[animation-fill-mode:backwards]"
			>
				Grocery list
			</h1>
			<SortTypeSelector>
				<Pill
					isActive={sortStyle === 'categories'}
					onClick={() => setSortStyle('categories')}
				>
					Categories
				</Pill>
				<Pill
					isActive={sortStyle === 'meals'}
					onClick={() => setSortStyle('meals')}
				>
					Meals
				</Pill>
				<Pill
					isActive={sortStyle === 'alphabetical'}
					onClick={() => setSortStyle('alphabetical')}
				>
					Alphabetical
				</Pill>
			</SortTypeSelector>
			{sortedGroceryList.length === 0 ? (
				<div className="bg-secondary-foreground p-10 text-center">
					<p className="pb-3 text-secondary">Your grocery list is empty</p>
					<p className="text-secondary">
						Click the button below to add items to your list
					</p>
				</div>
			) : (
				<div>
					{categories.map(category => {
						const items = mappedGroceryList[category.id]
						return (
							<Fragment key={category.id}>
								<CategoryTitle name={category.name} />
								{items.map((item, index) => {
									const bgColor = index % 2 === 0 ? 'bg-card' : 'bg-background'
									const name =
										'item' in item ? item.item.name : item.mealItem.item.name
									return (
										<Item
											key={item.id}
											className={bgColor}
											name={name}
											quantity={item.quantity}
										/>
									)
								})}
							</Fragment>
						)
					})}
				</div>
			)}
		</main>
	)

	// return (
	// 	<main className="font-poppins grid h-full">
	// 		<div className="grid px-4 xl:grid-cols-2 xl:gap-24">
	// 			<div className="flex max-w-md flex-col gap-5 xl:order-2 xl:items-start xl:text-left">
	// 				<fetcher.Form ref={formRef} method="post">
	// 					<li
	// 						className={`flex items-center justify-between border-b border-accent p-3`}
	// 					>
	// 						<input type="text" name="name" placeholder="Add an item" />
	// 						<button name="_action" value="add" disabled={isSubmitting}>
	// 							Add
	// 						</button>
	// 					</li>
	// 				</fetcher.Form>
	// 			</div>
	// 		</div>
	// 	</main>
	// )
}

function SortTypeSelector({ children }: { children: React.ReactNode }) {
	return <div className="flex px-10 py-2">{children}</div>
}

function Pill({
	isActive = false,
	...props
}: {
	isActive?: boolean
} & ComponentPropsWithoutRef<'button'>) {
	return (
		<button
			className={cn(
				'align-center flex h-10 items-center gap-2 rounded-md p-4 font-semibold text-foreground',
				isActive ? 'bg-tab-background-active' : 'bg-tab-background',
			)}
			{...props}
		/>
	)
}

function CategoryTitle({ name }: { name: string }) {
	return (
		<h2 className="px-6 py-3 font-bold text-primary">
			<Icon name="arrow-right" /> {name}
		</h2>
	)
}

function Item({
	className,
	name,
	quantity,
}: {
	className: string
	name: string
	quantity: string
}) {
	return (
		<label htmlFor={name}>
			<Card className={className}>
				<CardHeader>
					<div className="flex items-center">
						<img src="https://via.placeholder.com/50" alt="" />
						<div className="flex flex-1 flex-col pl-2">
							<CardTitle>{name}</CardTitle>
							<CardDescription>{quantity}</CardDescription>
						</div>
						<Checkbox id={name} />
					</div>
				</CardHeader>
			</Card>
		</label>
	)
}

// function ListItem({
// 	id,
// 	name,
// 	checked,
// }: {
// 	id: string
// 	name: string
// 	checked: boolean
// }) {
// 	const fetcher = useFetcher()
// 	return (
// 		<fetcher.Form method="post">
// 			<input type="hidden" name="id" value={id} />
// 			<li
// 				className={`flex items-center justify-between border-b border-accent p-3`}
// 			>
// 				<span className={`${checked ? 'line-through' : ''}`}>{name}</span>
// 				{checked ? (
// 					<button type="submit" name="_action" value="undo">
// 						undo
// 					</button>
// 				) : (
// 					<button type="submit" name="_action" value="delete">
// 						X
// 					</button>
// 				)}
// 			</li>
// 		</fetcher.Form>
// 	)
// }
