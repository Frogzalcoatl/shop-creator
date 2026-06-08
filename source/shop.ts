import type { EntityInventoryComponent, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ShopOfferCategory } from "./shopOffer";

export class Shop {
	public name: string;
	private _categories: ShopOfferCategory[];

	// Non categorized offers that appear on the main menu of shop ui
	private globalCategory: ShopOfferCategory;

	// Value updated with Date.now() when shop is edited to prevent ui mismatch purchases
	private editTimestamp: number;

	constructor(name: string) {
		this.name = name;
		this._categories = [];
		this.globalCategory = new ShopOfferCategory("Global");
		this.editTimestamp = Date.now();
	}

	public getCategoriesArr(updateEditTimestamp: boolean = true): ShopOfferCategory[] {
		if (updateEditTimestamp) {
			this.editTimestamp = Date.now();
		}
		return this._categories;
	}

	public getGlobalCategory(updateEditTimestamp: boolean = true): ShopOfferCategory {
		if (updateEditTimestamp) {
			this.editTimestamp = Date.now();
		}
		return this.globalCategory;
	}

	public async showForm(viewer: Player, inventory: EntityInventoryComponent): Promise<void> {
		const form = new ActionFormData();
		form.title(this.name);
		for (const category of this._categories) {
			form.button(category.name);
		}
		for (const offer of this.globalCategory.offers) {
			offer.addToForm(form, inventory);
		}

		const versionShown = this.editTimestamp;

		const result = await form.show(viewer);
		if (result.canceled || result.selection === undefined) {
			return;
		}

		// Shop content has been changed since viewer triggered form.show()
		if (this.editTimestamp !== versionShown) {
			viewer.sendMessage(
				"Unable to purchase item. Shop content has been changed by an operator.",
			);
			return;
		}
	}
}
