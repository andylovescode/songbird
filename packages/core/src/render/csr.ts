import { EachView, ElementView, FragmentView, TextView, View } from '../markup';
import { signalify, Store, store } from '../signals';

function render_text(view: TextView) {
	const text = document.createTextNode('');

	signalify(view[1]).subscribe(
		(value) => (text.textContent = value?.toString() ?? ''),
	);

	return text;
}

function render_fragment(view: FragmentView) {
	const fragment = document.createElement('div');

	fragment.style.display = 'contents';

	for (const child of view[1]) {
		fragment.appendChild(render(child));
	}

	return fragment;
}

function render_element(view: ElementView) {
	const element = document.createElement(view[1].tag);

	for (const [key, value] of Object.entries(view[1].props)) {
		signalify(value).subscribe((value) => {
			if (value === undefined) {
				element.removeAttribute(key);
			} else {
				element.setAttribute(key, value.toString());
			}
		});
	}

	for (const child of view[1].children) {
		element.appendChild(render(child));
	}

	return element;
}

function render_each<T>(view: EachView<T>) {
	const container = document.createElement('div');

	container.style.display = 'contents';

	const boxes: { value: Store<T>; element: Node }[] = [];

	view[1].items.subscribe((items) => {
		while (boxes.length < items.length) {
			const value = store(items[boxes.length]);
			const element = render(view[1].render(value));

			boxes.push({
				value,
				element,
			});

			container.appendChild(element);
		}

		while (boxes.length > items.length) {
			const top = boxes.pop()!;

			container.removeChild(top.element);
		}

		for (let i = 0; i < items.length; i++) {
			boxes[i].value.set(items[i]);
		}
	});

	return container;
}

function render(view: View): Node {
	switch (view[0]) {
		case 'songbird.text':
			return render_text(view);
		case 'songbird.html.fragment':
			return render_fragment(view);
		case 'songbird.html.element':
			return render_element(view);
		case 'songbird.each':
			return render_each(view);
		default:
			throw new Error(`unknown node type ${view[0]}`);
	}
}

export function mount(view: View, target: Element) {
	target.innerHTML = '';

	const element = render(view);

	target.appendChild(element);
}
