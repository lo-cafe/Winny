/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type {
    ChatInputCommandInteraction,
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type SubCommand from "./subCommand";

/**
 * Represents an Application Command
 */
export default class SlashCommand {
    data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
    hasSubCommands: boolean;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void;

    /**
     *      data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder
     *      hasSubCommands?: boolean
     *      execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void
     *  }} options - The options for the slash command
     * @param options
     */
    constructor(options: {
        data: any;
        hasSubCommands?: boolean;
        execute?: (interaction: ChatInputCommandInteraction) => Promise<void> | void;
    }) {
        if (options.hasSubCommands) {
            this.execute = async (interaction: ChatInputCommandInteraction) => {
                const subCommandGroup = interaction.options.getSubcommandGroup();
                const commandName = interaction.options.getSubcommand();

                if (!commandName) {
                    await interaction.reply({
                        content: "I couldn't understand that command!",
                        ephemeral: true,
                    });
                } else {
                    try {
                        const command = (
                            await import(
                                `../subCommands/${this.data.name}/${subCommandGroup ? `${subCommandGroup}/` : ""
                                }${commandName}.js`
                            )
                        ).default as SubCommand;
                        await command.execute(interaction);
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({
                            content: "An error occured when attempting to execute that command!",
                            ephemeral: true,
                        });
                    }
                }
            };
        } else if (options.execute) {
            this.execute = options.execute;
        } else {
            throw new Error("No execute function provided");
        }

        this.data = options.data;
        this.hasSubCommands = options.hasSubCommands ?? false;
    }
}
