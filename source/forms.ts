import { type Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

export const FSC_FORMS = {
	operator: {
		async mainMenu(viewer: Player): Promise<void> {
			const form = new ActionFormData();
			form.title("Shop Creator Menu");
			form.button("Manage Shops");
			const result = await form.show(viewer);
			if (result.canceled || result.selection === undefined) {
				return;
			}

			world.sendMessage(result.selection.toString());

			// Manage Shops
			if (result.selection === 0) {
				FSC_FORMS.operator.manageShops(viewer);
			}
		},
		async manageShops(viewer: Player): Promise<void> {
			const form = new ActionFormData();
			form.title("Manage Shops");
		},
	},
};
