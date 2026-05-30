import "@minecraft/server";
import type { EntityInventoryComponent, ItemStack, ItemType, Player } from "@minecraft/server";

// Capitalize param makes the first character after all underscores capital. Also makes the character after the namespace colan capital
export function removeNamespaceAndUnderscores(
	str: string,
	capitalize: boolean,
	pluralize: boolean,
): string {
	const arr: string[] = str.split("");
	let namespaceId: number = -1;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] === "_") {
			arr[i] = " ";
			if (capitalize && i < arr.length - 1) {
				arr[i + 1] = arr[i + 1].toUpperCase();
			}
		} else if (namespaceId === -1 && arr[i] === ":") {
			namespaceId = i;
			if (capitalize && i < arr.length - 1) {
				arr[i + 1] = arr[i + 1].toUpperCase();
			}
		}
	}

	if (pluralize) {
		if (arr[arr.length - 1] !== "s") {
			arr.push("s");
		} else {
			arr.push("'");
		}
	}

	if (namespaceId !== -1) {
		return arr.join("").slice(namespaceId + 1);
	} else {
		return arr.join("");
	}
}

// Determines whether a container has at least n amount of item type. Returns array of slot ids containing item type.
export function hasItemAmount(
	inventory: EntityInventoryComponent,
	item: ItemType,
	amountToFind: number,
): { bool: boolean; inSlots: number[] } {
	if (amountToFind === 0) {
		return {
			bool: true,
			inSlots: [],
		};
	}
	if (amountToFind < 0) {
		return {
			bool: false,
			inSlots: [],
		};
	}
	let amountFound: number = 0;
	const inSlots: number[] = [];
	for (let i = 0; i < inventory.container.size; i++) {
		const slotItem = inventory.container.getItem(i);
		if (!slotItem) {
			continue;
		}

		if (slotItem.type.id === item.id) {
			amountFound += slotItem.amount;
			inSlots.push(i);
		}

		if (amountFound >= amountToFind) {
			return {
				bool: true,
				inSlots: inSlots,
			};
		}
	}
	return {
		bool: false,
		inSlots: inSlots,
	};
}

// Works similarly to the /clear command. Only difference is that it will not clear if container does not have enough of requested item.
// Use inSlots if you already ran hasItemAmount
export function clearItem(
	inventory: EntityInventoryComponent,
	item: ItemType,
	amountToClear: number,
	inSlots?: number[],
): { bool: boolean; message: string } {
	if (amountToClear === 0) {
		return {
			bool: true,
			message: `Cleared 0 ${removeNamespaceAndUnderscores(item.id, true, true)} (as requested)`,
		};
	}
	if (amountToClear !== undefined && amountToClear < 0) {
		return {
			bool: false,
			message: "Unable to clear negative amount of item. (Use give instead?)",
		};
	}
	if (!inSlots) {
		const hasItemAmountResult = hasItemAmount(inventory, item, amountToClear ?? 1);
		if (!hasItemAmountResult.bool) {
			return {
				bool: false,
				message: `Not enough ${removeNamespaceAndUnderscores(item.id, true, true)}`,
			};
		}
		inSlots = hasItemAmountResult.inSlots;
	}

	// Clears all instances of item when amountToClear is undefined
	if (amountToClear === undefined) {
		for (const slot of inSlots) {
			const slotItem = inventory.container.getItem(slot);
			if (!slotItem) {
				continue;
			}
			if (slotItem.type.id === item.id) {
				inventory.container.setItem(slot);
			}
		}
		return {
			bool: true,
			message: `Cleared all instances of ${removeNamespaceAndUnderscores(item.id, true, true)}`,
		};
	}

	// Clears a specific amount of an item
	let potentialWarning: string = "";
	let amountLeft: number = amountToClear;
	for (const slot of inSlots) {
		const slotItem = inventory.container.getItem(slot);
		if (!slotItem) {
			potentialWarning =
				"Warning, unable to get item in one or more slots. (This isnt normal)";
			continue;
		}
		if (slotItem.amount <= amountLeft) {
			amountLeft -= slotItem.amount;
			inventory.container.setItem(slot);
		} else {
			slotItem.amount -= amountLeft;
			inventory.container.setItem(slot, slotItem);
			break;
		}
	}

	return {
		bool: true,
		message:
			`Cleared ${amountToClear} ${removeNamespaceAndUnderscores(item.id, true, amountToClear !== 1)}` +
			potentialWarning,
	};
}

export function giveItem(
	player: Player,
	inventory: EntityInventoryComponent,
	itemStack: ItemStack,
	amountToGive: number = 1,
): { bool: boolean; message: string } {
	let amountLeft: number = amountToGive;
	while (amountLeft > 0) {
		itemStack.amount = Math.min(itemStack.maxAmount, amountLeft);
		const result = inventory.container.addItem(itemStack);

		// Inventory is full
		if (result !== undefined) {
			break;
		}

		amountLeft -= itemStack.amount;
	}

	// Items should be spawned as entities
	while (amountLeft > 0) {
		itemStack.amount = Math.min(itemStack.maxAmount, amountLeft);
		player.dimension.spawnItem(itemStack, player.location);
		amountLeft -= itemStack.amount;
	}

	return {
		bool: true,
		message: `Gave ${player.name} ${amountToGive} ${removeNamespaceAndUnderscores(itemStack.type.id, true, true)}`,
	};
}
