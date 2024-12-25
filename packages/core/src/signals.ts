/*
 * A signal is a value that can be subscribed to
 * @see Subscription
 * @see store
 */
export interface Signal<Value> {
	get(): Value;
	subscribe(callback: (value: Value) => void): Subscription;
}

/*
 * A subscription to a signal
 * @see Signal
 */
export interface Subscription {
	/*
	 * Unsubscribes from the signal
	 */
	unsubscribe(): void;
}

/*
 * A store is a signal that can be updated
 * @see Signal
 * @see store
 */
export interface Store<Value> extends Signal<Value> {
	/*
	 * Updates the value of the store
	 */
	set(value: Value): void;
}

/*
 * Creates a new store, the core signal
 *
 * @param initialValue - The initial value of the store
 * @returns A store that can be subscribed to and updated
 *
 * @see Signal
 * @see Store
 */
export function store<Value>(initialValue: Value): Store<Value> {
	let value = initialValue;
	let subscriptions: Array<(value: Value) => void> = [];

	return {
		get() {
			return value;
		},
		set(newValue) {
			if (value === newValue) {
				return;
			}

			value = newValue;

			for (const run of subscriptions) {
				run(value);
			}
		},
		subscribe(run) {
			subscriptions.push(run);

			run(value);

			return {
				unsubscribe() {
					subscriptions = subscriptions.filter((fn) => fn !== run);
				},
			};
		},
	};
}

/*
 * A utility type that unwraps a signal to its value type
 */
export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;

/*
 * A utility type that unwraps an array of signals to their value types
 */
export type UnwrapSignals<T extends any[]> = {
	[K in keyof T]: UnwrapSignal<T[K]>;
};

/*
 * A function that creates a derived signal from a set of input signals
 * The output signal will be updated whenever any of the input signals change
 *
 * @param inputs - An array of input signals
 * @param fn - A function that takes the values of the input signals and returns the value of the output signal
 * @returns A signal that is updated whenever any of the input signals change
 */
export function derived<Inputs extends Signal<any>[], Output>(
	inputs: Inputs,
	fn: (...values: UnwrapSignals<Inputs>) => Output,
): Signal<Output> {
	const core = store(
		fn(...(inputs.map((store) => store.get()) as UnwrapSignals<Inputs>)),
	);

	function invalidate() {
		core.set(
			fn(
				...(inputs.map((store) =>
					store.get(),
				) as UnwrapSignals<Inputs>),
			),
		);
	}

	for (const store of inputs) {
		store.subscribe(invalidate);
	}

	return core;
}

/*
 * A utility type that maps a union to a signal union
 * Primarily for internal use
 */
export type MapUnionToSignal<T> = T extends any ? Signal<T> : unknown;

/*
 * A type that makes DX better, by allowing people to pass non-signals to functions, this should usually be paired with a signalify
 *
 * @see signalify
 */
export type SignalOrBase<Types> =
	| MapUnionToSignal<Types>
	| Types
	| Signal<Types>;

/*
 * A primitive with a toString function
 *
 * @see ToStringableSignal
 */
export type ToStringable = string | number | boolean | undefined;

/*
 * A signal that when subscribed, has a toString method (but only primitives)
 *
 * @see ToStringable
 * @see SignalOrBase
 */
export type ToStringableSignal = SignalOrBase<ToStringable>;

/*
 * Takes a value that's either a signal or not a signal and makes sure it's a nice, clean signal
 *
 * @see SignalOrBase
 */
export function signalify<T>(value: SignalOrBase<T>): Signal<T> {
	if (typeof value === 'object' && value !== null && 'subscribe' in value) {
		return value as unknown as Signal<T>;
	}

	return store(value) as unknown as Signal<T>;
}

/*
 * Quick function that uses the weird string templating syntax to allow for easy templating
 *
 * ```ts
 * const name = store("Ash");
 * const header = text`Hello, ${name}!`;
 * ```
 */
export function text(
	strings: TemplateStringsArray,
	...values: ToStringableSignal[]
): Signal<string> {
	const value_signals = values.map(signalify);

	return derived(value_signals, (...values) => {
		let result = '';

		for (let i = 0; i < strings.length; i++) {
			result += strings[i];

			if (i < values.length) {
				result += values[i];
			}
		}

		return result;
	});
}
