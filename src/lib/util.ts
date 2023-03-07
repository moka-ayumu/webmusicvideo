import { get, writable } from 'svelte/store';

export function createDiffer(i = -1) {
	const store = writable(i);
	const { subscribe, set } = store;

	return {
		subscribe,
		set: (v: number) => {
			const value = get(store);
			if (value !== v) {
				set(v);
				return true;
			} else {
				return false;
			}
		},
		reset: () => set(i)
	};
}
