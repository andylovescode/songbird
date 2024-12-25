import { Signal, signalify, SignalOrBase, ToStringableSignal } from './signals';

export type View = TextView | ElementView | FragmentView | EachView<any>; // TODO: if, maybe switch?

export type FragmentView = ['songbird.html.fragment', View[]];

export type ElementView = [
	'songbird.html.element',
	{
		tag: string;
		props: Record<string, ToStringableSignal>;
		children: View[];
	},
];

export type EachView<T> = [
	'songbird.each',
	{
		render(item: Signal<T>): View;
		items: Signal<T[]>;
	},
];

export type TextView = ['songbird.text', ToStringableSignal];

export function is_view(item: unknown): item is View {
	const types: View[0][] = [
		'songbird.html.element',
		'songbird.html.fragment',
		'songbird.text',
		'songbird.each',
	];

	return (
		typeof item === 'object' &&
		Array.isArray(item) &&
		types.includes(item[0])
	);
}

export type Child = View | ToStringableSignal;

export function child_to_view(child: Child): View {
	if (is_view(child)) {
		return child;
	}

	return ['songbird.text', child];
}

declare global {
	module JSX {
		type IntrinsicElements = Record<
			keyof HTMLElementTagNameMap,
			Record<string, any>
		>;
	}
}

export const jsx = {
	element(
		tag: string | Function,
		props?: Record<string, ToStringableSignal>,
		...children: Child[]
	) {
		if (tag === this.frag) {
			return ['songbird.html.fragment', children.map(child_to_view)];
		}
		if (tag instanceof Function) {
			return tag(props) as View;
		}
		return [
			'songbird.html.element',
			{
				tag,
				props: props ?? {},
				children: children.map(child_to_view),
			},
		];
	},
	frag: 'songbird.html.fragment',
};

export function Each<T>({
	items,
	render,
}: {
	items: SignalOrBase<T[]>;
	render: (item: Signal<T>) => View;
}): EachView<T> {
	return [
		'songbird.each',
		{
			items: signalify(items),
			render,
		},
	];
}
