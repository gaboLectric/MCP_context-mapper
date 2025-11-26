#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// Crear la instancia del servidor MCP
// Usamos la clase 'Server' para definir nuestras capacidades y herramientas.
// 'name' y 'version' son requeridos para que el cliente identifique este servidor.
const server = new Server(
    {
        name: "context-mapper",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {}, // Exponemos herramientas, así que declaramos esta capacidad
        },
    }
);

/**
 * Función auxiliar para la herramienta get_file_structure.
 * Genera recursivamente una representación en string tipo árbol de la estructura de directorios.
 * 
 * @param currentPath - La ruta absoluta al directorio que se está visitando.
 * @param depth - La profundidad máxima para recorrer.
 * @param currentDepth - El nivel de profundidad actual (comienza en 0).
 * @returns Un string representando el árbol de directorios.
 */
async function generateTree(
    currentPath: string,
    depth: number,
    currentDepth: number = 0
): Promise<string> {
    if (currentDepth >= depth) {
        return "";
    }

    // Lista de carpetas a ignorar para mantener la salida limpia y relevante.
    const ignoredFolders = new Set(["node_modules", ".git", ".next", ".venv", "dist", ".gemini"]);

    try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        let result = "";

        // Ordenar entradas: directorios primero, luego archivos.
        // Esto hace que la salida del árbol sea más fácil de leer.
        entries.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            if (entry.isDirectory() && ignoredFolders.has(entry.name)) {
                continue;
            }

            const isLast = i === entries.length - 1;
            const prefix = "  ".repeat(currentDepth) + (isLast ? "└── " : "├── ");

            result += `${prefix}${entry.name}${entry.isDirectory() ? "/" : ""}\n`;

            if (entry.isDirectory()) {
                const subTree = await generateTree(
                    path.join(currentPath, entry.name),
                    depth,
                    currentDepth + 1
                );
                result += subTree;
            }
        }
        return result;
    } catch (error) {
        return `Error reading directory ${currentPath}: ${error instanceof Error ? error.message : String(error)}\n`;
    }
}

// Manejador para listar herramientas (List Tools)
// Este manejador le dice al cliente qué herramientas están disponibles.
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_file_structure",
                description: "Obtener una vista de pájaro de la estructura de archivos, similar al comando 'tree'.",
                inputSchema: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "Ruta del directorio base (default: directorio actual)",
                        },
                        depth: {
                            type: "number",
                            description: "Profundidad de recursión (default: 2)",
                        },
                    },
                },
            },
            {
                name: "analyze_imports",
                description: "Analizar imports en un archivo específico para entender sus dependencias.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filepath: {
                            type: "string",
                            description: "Ruta al archivo a analizar",
                        },
                    },
                    required: ["filepath"],
                },
            },
        ],
    };
});

// Manejador de llamada a herramienta (Call Tool)
// Este manejador ejecuta la lógica real cuando se llama a una herramienta.
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // --- Herramienta: get_file_structure ---
    if (name === "get_file_structure") {
        const basePath = String(args?.path || ".");
        const depth = Number(args?.depth || 2);
        const resolvedPath = path.resolve(basePath);

        try {
            const stats = await fs.stat(resolvedPath);
            if (!stats.isDirectory()) {
                return {
                    content: [{ type: "text", text: `Error: ${basePath} is not a directory.` }],
                    isError: true,
                };
            }

            const treeOutput = await generateTree(resolvedPath, depth);
            return {
                content: [{ type: "text", text: `Directory structure for ${resolvedPath}:\n\n${treeOutput}` }],
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error accessing path ${basePath}: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    }

    // --- Herramienta: analyze_imports ---
    if (name === "analyze_imports") {
        const filepath = String(args?.filepath);
        if (!filepath) {
            return {
                content: [{ type: "text", text: "Error: filepath is required" }],
                isError: true
            };
        }
        const resolvedPath = path.resolve(filepath);

        try {
            const content = await fs.readFile(resolvedPath, "utf-8");

            // Explicación del Regex:
            // ^\s*import       -> Coincide con líneas que empiezan con 'import' (ignorando espacios iniciales)
            // \s+              -> Requiere al menos un espacio después de 'import'
            // (?:              -> Inicio de grupo de no captura para la cláusula de importación (ej: { Foo } from)
            //   [\w\s{},*]+    -> Coincide con identificadores, llaves, comas, asteriscos (ej: { Foo }, * as Bar)
            //   \s+from\s+     -> Coincide con la palabra clave 'from' rodeada de espacios
            // )?               -> Toda la cláusula es opcional para soportar imports de efectos secundarios (ej: import './style.css')
            // ['"]([^'"]+)['"] -> Captura la ruta del módulo dentro de comillas simples o dobles
            const importRegex = /^\s*import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/gm;

            const imports = [];
            let match;

            // Iterar sobre todas las coincidencias en el contenido del archivo
            while ((match = importRegex.exec(content)) !== null) {
                imports.push({
                    module: match[1], // El primer grupo capturado es la ruta del módulo
                    code: match[0].trim(), // El string completo coincidente es la declaración de import completa
                });
            }

            return {
                content: [{ type: "text", text: JSON.stringify(imports, null, 2) }],
            };
        } catch (error) {
            if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
                return {
                    content: [{ type: "text", text: `Error: File not found at ${resolvedPath}` }],
                    isError: true
                };
            }
            return {
                content: [{ type: "text", text: `Error reading file ${filepath}: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    }

    throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Context Mapper MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
