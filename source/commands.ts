import {
	CommandPermissionLevel,
	type CustomCommand,
	type CustomCommandOrigin,
	type CustomCommandResult,
	EntityComponentTypes,
	ItemTypes,
	type Player,
	system,
} from "@minecraft/server";
import { FSC_FORMS } from "./forms";

const COMMANDS: {
	command: CustomCommand;
	callback: (origin: CustomCommandOrigin) => CustomCommandResult | undefined;
}[] = [];

COMMANDS.push({
	callback(origin: CustomCommandOrigin): CustomCommandResult | undefined {
		if (origin.sourceEntity?.typeId !== "minecraft:player") {
			return undefined;
		}
		const player: Player = origin.sourceEntity as Player;
		const inventory = player.getComponent(EntityComponentTypes.Inventory);
		const item = ItemTypes.get("gold_ingot");
		if (inventory && item) {
			system.run(() => {
				FSC_FORMS.operator.mainMenu(player);
			});
		}
		return undefined;
	},
	command: {
		description: "Used to test stuf",
		name: "fsc:test",
		permissionLevel: CommandPermissionLevel.Any,
	},
});

system.beforeEvents.startup.subscribe((e) => {
	for (const c of COMMANDS) {
		e.customCommandRegistry.registerCommand(c.command, c.callback);
	}
});
