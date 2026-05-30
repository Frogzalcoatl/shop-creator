import type { EntityInventoryComponent, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ShopOfferCategory } from "./shopOffer";

export class Shop {
	public name: string;
	private categories: ShopOfferCategory[];

	// Non categorized offers that appear on the main menu of shop ui
	private globalCategory: ShopOfferCategory;

	// Incremented when shop is updated to prevent ui mismatch purchases when shop content is updated
	private version: number;

	constructor(name: string) {
		this.name = name;
		this.categories = [];
		this.globalCategory = new ShopOfferCategory("Global");
		this.version = 1;
	}

	public removeCategory(index: number): ShopOfferCategory | undefined {
		if (index >= this.categories.length || index < 0) {
			return undefined;
		}
		this.version++;
		return this.categories.splice(index, 1)[0];
	}

	public addCategory(category: ShopOfferCategory): void {
		this.version++;
		this.categories.push(category);
	}

	public swapCategories(index1: number, index2: number): boolean {
		if (
			index1 < 0 ||
			index1 >= this.categories.length ||
			index2 < 0 ||
			index2 >= this.categories.length ||
			index1 === index2
		) {
			return false;
		}
		const temp = this.categories[index1];
		this.categories[index1] = this.categories[index2];
		this.categories[index2] = temp;
		this.version++;
		return true;
	}

	// Dont forget to update this.version
	// -1 for global category
	public getCategory(index: number): ShopOfferCategory | undefined {
		if (index === -1) {
			return this.globalCategory;
		}
		if (index < 0 || index >= this.categories.length) {
			return undefined;
		}
		return this.categories[index];
	}

	public async showForm(viewer: Player, inventory: EntityInventoryComponent): Promise<void> {
		const form = new ActionFormData();
		form.title(this.name);
		for (const category of this.categories) {
			form.button(category.name);
		}
		for (const offer of this.globalCategory.offers) {
			offer.addToForm(form, inventory);
		}

		const versionShown = this.version;

		const result = await form.show(viewer);
		if (result.canceled || result.selection === undefined) {
			return;
		}

		// Shop content has been changed since viewer triggered form.show()
		if (this.version !== versionShown) {
			viewer.sendMessage(
				"Unable to purchase item. Shop content has been changed by an operator.",
			);
			return;
		}
	}
}
