// Require express and body-parser
import express from "express";
import multer, { StorageEngine } from 'multer';
import path from "path";
import {generateTimeBasedUUID} from "./globals/security";
import {handleUploaded} from "./themesHandler/handleUploaded";
import {cacheFolder} from "./globals/constants";
import {
    deleteThemeWithID,
    getAllThemes,
    getThemeFromID, getThemeStatus,
    SavableMetadata,
    updateThemeWithID
} from "./databaseHandler/saveToDB";
import ws from "ws";
import cors from "cors";

//minimal express server
const app = express();
const PORT = 3000;
export const wsServer = new ws.Server({noServer: true});

//start the express server on port 3000
export function expressServer(secret: string) {
    app.use(express.json());
    app.use(cors());
    const server = app.listen(PORT, () => console.log(`Now listening on port ${PORT} 🚀`));

    // setting up disk storage
    const storage = multer.diskStorage({
        destination: (req: any, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
            callback(null, cacheFolder)
        },
        filename: (req: any, file: Express.Multer.File, callback: (error: Error | null , destination: string) => void) => {
            const ext = path.extname(file.originalname);
            const filePath = `${generateTimeBasedUUID()}${ext}`;
            callback(null, filePath);
        }
    })

    const upload = multer({ storage: storage });

    //----------- Websocket -----------
    // Set up a headless websocket server
    // wsServer.on("connection", (socket: any) => {
    //     socket.on("message", function message(data: any, isBinary: any) {
    //         let msg = isBinary ? data : data.toString();
    //         try {
    //             msg = JSON.parse(msg);
    //         } catch (error) {
    //             msg = msg;
    //         }
    //         // websocketMessageHandler(msg, socket);
    //     });
    // });
    //
    // // on close function -- it just prints the reason
    // wsServer.on("close", function close(code: any, data: any) {
    //     const reason = data.toString();
    //     console.log(`Disconnected with code ${code} and reason ${reason}`);
    //     // Continue as before.
    // });
    //
    // // this handles the initial handshake and upgrade from HTTP to WS
    // server.on("upgrade", (request: any, socket: any, head: any) => {
    //     wsServer.handleUpgrade(request, socket, head, (socket: any) => {
    //         wsServer.emit("connection", socket, request);
    //     });
    // });

    //----------- HTTP Request Handler -----------

    // this handles the cors preflight request
    app.options("*", cors());

    //Handle File Uploads
    app.post('/themes/upload', upload.single('file'), (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            if (!req.file) {
                return res.status(400).json({message: 'No file uploaded'});
            }

            const extension = path.extname(req.file.originalname);
            if (extension !== '.zip') {
                return res.status(400).json({message: 'Only .zip files are allowed'});
            }

            res.status(200).json({message: 'File uploaded successfully'});
            handleUploaded(req.file.filename).then(r => {
                //TODO: Add some feedback
            });
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let themes = await getAllThemes()
            res.status(200).json(themes);
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/:themeID", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID
            let theme = await getThemeFromID(id)
            res.status(200).json(theme);
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.get("/themes/status/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            let id = req.params.themeID;
            let status = await getThemeStatus(id);

            if (status) {
                res.status(200).json({ status: status });
            } else {
                res.status(404).json({ error: "Theme not found" });
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.status(403).json({ error: "Forbidden" });
        }
    });


    app.delete("/themes/:themeID", async (req: any, res: any) => {
        //get the campaign channel form my server
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID
            let deleted = await deleteThemeWithID(id)
            if(deleted) {
                res.sendStatus(200)
            } else {
                res.sendStatus(500)
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403);
        }
    });

    app.put("/themes/:themeID", async (req: any, res: any) => {
        if (
            req.headers.authorization.split(" ")[0] == "Bearer" &&
            req.headers.authorization.split(" ")[1] == secret
        ) {
            //Handle got message
            let id = req.params.themeID;
            // Include the update data in req.body
            let updateData = req.body as Partial<SavableMetadata>;

            let updated = await updateThemeWithID(id, updateData);

            if(updated) {
                res.sendStatus(200); // OK
            } else {
                res.sendStatus(500); // Internal Server Error
            }
        } else {
            console.error("Error: Bearer Token mismatch");
            res.sendStatus(403); // Forbidden
        }
    });
}