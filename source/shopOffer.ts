import type { EntityInventoryComponent, ItemStack, Player } from "@minecraft/server";
import type { ActionFormData } from "@minecraft/server-ui";
import { clearItem, giveItem, hasItemAmount, removeNamespaceAndUnderscores } from "./itemUtils";

export class ShopOffer {
	constructor(
		public item: ItemStack,
		public itemAmount: number,
		public priceItem: ItemStack,
		public priceItemAmount: number,
	) {}

	public purchase(
		player: Player,
		inventory: EntityInventoryComponent,
	): { bool: boolean; message: string } {
		const hasItemAmountResult = hasItemAmount(
			inventory,
			this.priceItem.type,
			this.priceItemAmount,
		);
		if (!hasItemAmountResult.bool) {
			return {
				bool: false,
				message: `Not enough ${removeNamespaceAndUnderscores(this.priceItem.typeId, true, true)}`,
			};
		}
		clearItem(inventory, this.priceItem.type, this.priceItemAmount);
		const result = giveItem(player, inventory, this.item, this.itemAmount);
		return {
			bool: true,
			message: result.message,
		};
	}

	public addToForm(form: ActionFormData, inventory: EntityInventoryComponent): void {
		const hasItemAmountResult = hasItemAmount(
			inventory,
			this.priceItem.type,
			this.priceItemAmount,
		);
		form.button(
			`§l${this.itemAmount}x ${this.item.nameTag ?? removeNamespaceAndUnderscores(this.item.type.id, true, true)}
			§r${hasItemAmountResult.bool ? "§a" : "§c"}${this.priceItemAmount} ${this.priceItem.nameTag ?? removeNamespaceAndUnderscores(this.priceItem.type.id, true, true)}`,
		);
	}
}

export class ShopOfferCategory {
	public name: string;
	public offers: ShopOffer[];
	constructor(name: string) {
		this.name = name;
		this.offers = [];
	}

	public removeOffer(index: number): ShopOffer | undefined {
		if (index < 0 || index >= this.offers.length) {
			return undefined;
		}
		return this.offers.splice(index, 1)[0];
	}

	public addOffer(offer: ShopOffer): void {
		this.offers.push(offer);
	}

	public swapOffer(index1: number, index2: number): boolean {
		if (
			index1 < 0 ||
			index1 >= this.offers.length ||
			index2 < 0 ||
			index2 >= this.offers.length ||
			index1 === index2
		) {
			return false;
		}
		const temp = this.offers[index1];
		this.offers[index1] = this.offers[index2];
		this.offers[index2] = temp;
		return true;
	}
}
