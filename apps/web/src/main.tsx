import { store, mount, derived, Signal, Each } from '@songbird/core';

const number = store(0);
const is_even = derived([number], (x) =>
	x % 2 == 0 ? 'this is even' : 'this is odd',
);

setInterval(() => {
	number.set(number.get() + 1);
});

function Digit({ digit }: { digit: Signal<string> }) {
	return <>{digit}</>;
}

function Number({ number }: { number: Signal<number> }) {
	const digits = derived([number], (x) => x.toString().split(''));

	return (
		<Each
			items={digits}
			render={(digit: Signal<string>) => <Digit digit={digit} />}
		/>
	);
}

function NumberInformation({ number }: { number: Signal<number> }) {
	return (
		<>
			<h1>
				About the number <Number number={number} />
			</h1>
			<p>{is_even}</p>
			<p>This is static!</p>
		</>
	);
}

mount(<NumberInformation number={number} />, document.body);
