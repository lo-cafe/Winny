import {MetadataColor, ThemeMetadata} from "../themesHandler/handleUploaded";
import * as Sequelize from "sequelize";
import {ApprovalStates} from "../themesHandler/approvalHanlder";
import * as trace_events from "trace_events";
import {Model, where} from "sequelize";

const sequelize = new Sequelize.Sequelize(
	"themes_database",
	"user",
	"password",
	{
		host: "localhost",
		dialect: "sqlite",
		logging: false,
		// SQLite only
		storage: "src/database/themes_database.sqlite",
	}
);

/**
 * Saves the theme metadata to the database.
 *
 * @param {ThemeMetadata} metadata - The metadata object for the theme.
 * @return {void}
 */
export async function saveToDB(metadata: ThemeMetadata): Promise<boolean> {
	let saveableMetaData = {
		file_name: metadata.file_name,
		file_id: metadata.file_id,
		theme_name: metadata.theme_name,
		theme_author: metadata.theme_author,
		theme_description: metadata.theme_description,
		message_id: metadata.message_id,
		attachment_url: metadata.attachment_url,
		approval_state: metadata.approval_state,
		color: metadata.color.hex,
		alpha: metadata.color.alpha,
		icon: metadata.icon
	} as SavableMetadata
	try {
		await ThemeTags.create(saveableMetaData as any)
		await ThemeTags.sync()
		return true;
	} catch (error){
		console.error(error)
		return false
	}
}

/**
 * Retrieves all themes from the database.
 *
 * @returns {Promise<Array<ThemeMetadata>>} - A promise that resolves to an array of theme metadata.
 */
export async function getAllThemes() {
	let themesTags = await ThemeTags.findAll()
	let themes = []
	for (const theme of themesTags) {
		themes.push(<ThemeMetadata>themeFromTags(theme))
	}

	return themes
}

/**
 * Retrieves a theme from its ID.
 *
 * @param {string} id - The ID of the theme to retrieve.
 * @returns {Promise<Theme>} - A Promise that resolves to the retrieved theme.
 */
export async function getThemeFromID(id: string) {
	let themeTag = await ThemeTags.findOne({where: {file_id: id}});
	return themeFromTags(themeTag)
}

/**
 * Deletes a theme with the specified ID from the database.
 *
 * @param {string} id - The ID of the theme to delete.
 * @return {Promise<boolean>} - A Promise that resolves to true if the theme is successfully deleted, otherwise resolves to false.
 */
export async function deleteThemeWithID(id: string): Promise<boolean> {
	try {
		await ThemeTags.destroy({
			where: {
				file_id: id
			}
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

/**
 * Updates the theme with the given ID using the provided update data.
 *
 * @param {string} id - The ID of the theme to update.
 * @param {Partial<SavableMetadata>} updateData - The data to update the theme with.
 * @return {Promise<boolean>} - A promise that resolves to `true` if the update was successful, and `false` otherwise.
 */
export async function updateThemeWithID(id: string, updateData: Partial<SavableMetadata>): Promise<boolean> {
	try {
		await ThemeTags.update(updateData, {
			where: {
				file_id: id
			}
		});
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

/**
 * Retrieves the approval state of the theme with the given ID.
 *
 * @param {string} id - The ID of the theme.
 * @return {Promise<ApprovalStates | undefined>} - A Promise that resolves to `ApprovalStates` if successful, and `undefined` otherwise.
 */
export async function getThemeStatus(id: string): Promise<ApprovalStates | undefined> {
	try {
		const theme = await getThemeFromID(id);
		return theme?.approval_state;
	} catch (error) {
		console.error(error);
	}
	return undefined
}

/**
 * Extracts metadata for a theme from a given tag.
 *
 * @param {Model<any, any> | null} tag - The tag to extract the metadata from.
 * @return {ThemeMetadata | undefined} The extracted theme metadata.
 */
function themeFromTags(tag: Model<any, any> | null): ThemeMetadata | undefined {
	if (!tag) return undefined;
	return {
		file_name: tag?.get("file_name") as string,
		file_id: tag?.get("file_id") as string,
		theme_name: tag?.get("theme_name") as string,
		theme_author: tag?.get("theme_author") as string,
		theme_description: tag?.get("theme_description") as string,
		approval_state: tag?.get("approval_state") as ApprovalStates,
		attachment_url:  tag?.get("attachment_url") as string,
		color: {
			hex: tag?.get("color") as string,
			alpha: tag?.get("alpha") as number,
		} as MetadataColor
	} as ThemeMetadata
}

export interface SavableMetadata {
	file_name: string
	file_id: string
	theme_name: string
	theme_author: string
	theme_description: string
	message_id: string
	attachment_url: string
	approval_state: ApprovalStates
	color: string
	alpha: number
	icon: string
}

export const ThemeTags = sequelize.define("themes", {
	//id have to be stored as string!
	file_name: {
		type: Sequelize.STRING,
		unique: false,
		allowNull: false,
	},
	file_id: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
	},
	theme_name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	theme_author: Sequelize.STRING,
	theme_description: Sequelize.TEXT,
	message_id: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	attachment_url: {
		type: Sequelize.STRING,
		allowNull: false
	},
	approval_state: Sequelize.STRING,
	color: Sequelize.STRING,
	alpha: {
		type: Sequelize.FLOAT,
		defaultValue: 0,
		allowNull: false,
	},
	icon: Sequelize.STRING,
});