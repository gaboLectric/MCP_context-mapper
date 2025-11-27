# Context Mapper MCP

> Servidor MCP que proporciona herramientas de análisis estructural para que agentes de IA comprendan proyectos de código sin consumir tokens leyendo archivos completos.

---

## Problema y Solución

| Problema | Solución |
|----------|----------|
| Leer todo el código de un proyecto grande consume tokens y tiempo excesivo | `context-mapper` actúa como un mapa que expone la estructura y dependencias del proyecto |

---

## Arquitectura

```
┌─────────────────┐      stdio       ┌──────────────────────┐
│  Cliente MCP    │◄───────────────►│  Context Mapper      │
│  (AI Agent)     │                  │  Server              │
└─────────────────┘                  └──────────┬───────────┘
                                                │
                                     ┌──────────┴───────────┐
                                     │                      │
                              ┌──────▼──────┐       ┌───────▼───────┐
                              │ get_file_   │       │ analyze_      │
                              │ structure   │       │ imports       │
                              └──────┬──────┘       └───────┬───────┘
                                     │                      │
                                     ▼                      ▼
                              fs.readdir()           fs.readFile()
                              + recursión            + regex parsing
```

**Transporte:** `stdio` — compatible con Claude Desktop, VS Code y cualquier cliente MCP.

---

## API de Herramientas

### `get_file_structure`

Genera una vista tipo `tree` de la estructura de directorios.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `path` | `string` | `.` | Directorio base |
| `depth` | `number` | `2` | Niveles de profundidad |

**Comportamiento:**
- Ordena: directorios primero, archivos después
- Ignora: `node_modules`, `.git`, `.next`, `.venv`, `dist`, `.gemini`
- Recursión controlada por `depth`

**Ejemplo de salida:**
```
├── src/
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

### `analyze_imports`

Extrae las declaraciones `import` de un archivo JavaScript/TypeScript.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `filepath` | `string` | ✓ | Ruta al archivo a analizar |

**Regex utilizado:**
```regex
/^\s*import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/gm
```

| Segmento | Función |
|----------|---------|
| `^\s*import` | Detecta líneas que inician con `import` |
| `(?:[\w\s{},*]+\s+from\s+)?` | Captura opcional de named/default imports |
| `['"]([^'"]+)['"]` | Extrae la ruta del módulo |

**Ejemplo de salida:**
```json
[
  { "module": "react", "code": "import React from \"react\"" },
  { "module": "./utils", "code": "import { helper } from \"./utils\"" }
]
```

---

## Implementación

### Estructura del código

```
src/index.ts
├── Server instantiation (MCP SDK)
├── generateTree()          → Función recursiva para get_file_structure
├── ListToolsRequestSchema  → Handler que expone las herramientas
├── CallToolRequestSchema   → Router que ejecuta la herramienta solicitada
└── main()                  → Inicializa transporte stdio
```

### Dependencias

| Paquete | Propósito |
|---------|-----------|
| `@modelcontextprotocol/sdk` | SDK oficial de MCP |
| `fs/promises` | Operaciones asíncronas de filesystem |
| `path` | Resolución de rutas |

---

## Instalación y Uso

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar servidor
node dist/index.js
```

### Configuración en cliente MCP

```json
{
  "mcpServers": {
    "context-mapper": {
      "command": "node",
      "args": ["/ruta/al/proyecto/dist/index.js"]
    }
  }
}
```

---

## Manejo de Errores

| Escenario | Respuesta |
|-----------|-----------|
| Ruta no es directorio | `Error: {path} is not a directory` |
| Archivo no encontrado | `Error: File not found at {path}` |
| Herramienta desconocida | `Error: Unknown tool: {name}` |

---

## Licencia

MIT
