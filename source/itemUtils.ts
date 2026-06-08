import "@minecraft/server";
import type { Container, Entity, ItemStack, ItemType, Player, Vector2 } from "@minecraft/server";

// Capitalize makes the first letter of each word uppercase.
export function removeNamespaceAndUnderscores(
	str: string,
	capitalize: boolean
): string {
	const namespaceColonIndex: number = str.indexOf(":");
	if (namespaceColonIndex !== -1) {
		str = str.slice(namespaceColonIndex + 1);
	}
	if (capitalize) {
		const words: string[] = str.split("_");
		for (let i = 0; i < words.length; i++) {
			words[i] = `${words[i][0].toUpperCase()}${words[i].slice(1)}`;
		}
		str = words.join(" ");
	}
	return str;
}

// Determines whether a container has at least x amount of item type. Returns array of slot ids containing item type.
export function hasItemAmount(
	container: Container,
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
	for (let i = 0; i < container.size; i++) {
		const slotItem = container.getItem(i);
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
// If amountToClear is undefined, clears all instances of item.
export function clearItem(
	container: Container,
	item: ItemType,
	amountToClear?: number
): { bool: boolean; message: string } {
	if (amountToClear === 0) {
		return {
			bool: true,
			message: `Cleared 0 ${removeNamespaceAndUnderscores(item.id, true)} (as requested)`,
		};
	}
	if (amountToClear !== undefined && amountToClear < 0) {
		return {
			bool: false,
			message: "Unable to clear negative amount of item. (Use give instead?)",
		};
	}
	const hasItemAmountResult = hasItemAmount(container, item, amountToClear ?? 1);
	if (!hasItemAmountResult.bool) {
		return {
			bool: false,
			message: `Not enough ${removeNamespaceAndUnderscores(item.id, true)}`,
		};
	}
	const inSlots: number[] = hasItemAmountResult.inSlots;

	// Clears all instances of item when amountToClear is undefined
	if (amountToClear === undefined) {
		for (const slot of inSlots) {
			const slotItem = container.getItem(slot);
			if (!slotItem) {
				continue;
			}
			if (slotItem.type.id === item.id) {
				container.setItem(slot);
			}
		}
		return {
			bool: true,
			message: `Cleared all instances of ${removeNamespaceAndUnderscores(item.id, true)}`,
		};
	}

	// Clears a specific amount of an item
	let amountLeft: number = amountToClear;
	for (const slot of inSlots) {
		const slotItem = container.getItem(slot);
		if (!slotItem) {
			continue;
		}
		if (slotItem.amount <= amountLeft) {
			amountLeft -= slotItem.amount;
			container.setItem(slot);
		} else {
			slotItem.amount -= amountLeft;
			container.setItem(slot, slotItem);
			break;
		}
	}

	if (amountLeft !== 0) {
		return {
			bool: false,
			message: `Did not clear intended amount of ${removeNamespaceAndUnderscores(item.id, true)}. (amountLeftToClear = ${amountLeft})`
		}
	}

	return {
		bool: true,
		message:
			`Cleared ${amountToClear}x ${removeNamespaceAndUnderscores(item.id, true)}`
	};
}

export function giveItem(
	player: Player,
	container: Container,
	itemStack: ItemStack,
	amountToGive: number = 1,
): { bool: boolean; message: string } {
	let amountLeft: number = amountToGive;
	while (amountLeft > 0) {
		itemStack.amount = Math.min(itemStack.maxAmount, amountLeft);
		const result = container.addItem(itemStack);

		// Inventory is full
		if (result !== undefined) {
			break;
		}

		amountLeft -= itemStack.amount;
	}

	// Items should be spawned as entities
	while (amountLeft > 0) {
		itemStack.amount = Math.min(itemStack.maxAmount, amountLeft);
		const itemEntity: Entity = player.dimension.spawnItem(itemStack, player.location);
		// Apply impulse as if the player is dropping the item.
		if (itemEntity.isValid) {
			const playerRotation: Vector2 = player.getRotation();
			itemEntity.applyImpulse({
				x: playerRotation.x,
				y: 1,
				z: playerRotation.y
			})
		}
		amountLeft -= itemStack.amount;
	}

	return {
		bool: true,
		message: `Gave ${player.name} ${amountToGive} ${removeNamespaceAndUnderscores(itemStack.type.id, true)}`,
	};
}
