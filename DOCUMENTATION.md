# Context Mapper MCP

## Documentación Completa v1.0.0

> Servidor MCP (Model Context Protocol) que proporciona herramientas de análisis estructural para que agentes de IA comprendan proyectos de código sin consumir tokens leyendo archivos completos.

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [El Problema: Consumo de Tokens](#el-problema-consumo-de-tokens)
3. [La Solución: Inteligencia Estructural](#la-solución-inteligencia-estructural)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Herramientas Principales](#herramientas-principales)
6. [Guía de Instalación](#guía-de-instalación)
7. [Configuración de Clientes MCP](#configuración-de-clientes-mcp)
8. [Referencia de API](#referencia-de-api)
9. [Patrones de Uso](#patrones-de-uso)
10. [Manejo de Errores](#manejo-de-errores)
11. [Requisitos del Sistema](#requisitos-del-sistema)
12. [Licencia](#licencia)

---

## Introducción

**Context Mapper** es un servidor MCP (Model Context Protocol) que permite a agentes de IA entender eficientemente proyectos de software sin necesidad de leer codebases completas. En lugar de cargar miles de líneas de código en el contexto, los agentes pueden consultar al servidor Context Mapper para obtener información estructural y de dependencias de forma precisa.

### Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Nombre del Servidor** | context-mapper |
| **Versión** | 1.0.0 |
| **Protocolo** | Model Context Protocol (MCP) |
| **Transporte** | stdio (stdin/stdout) |
| **Lenguaje** | TypeScript |
| **Runtime** | Node.js v16+ |
| **Punto de Entrada** | dist/index.js |

---

## El Problema: Consumo de Tokens

Los agentes de IA que operan sobre codebases enfrentan una limitación fundamental: **límites de tokens**. Los enfoques tradicionales requieren que los agentes lean archivos o directorios completos, consumiendo cantidades masivas de tokens y recursos computacionales.

| Problema | Impacto |
|----------|---------|
| **Desbordamiento de Contexto** | Proyectos grandes exceden las ventanas de contexto de los modelos |
| **Alto Costo de Tokens** | Leer archivos completos desperdicia tokens en contenido irrelevante |
| **Tiempos de Respuesta Lentos** | Procesar miles de líneas retrasa las respuestas del agente |
| **Consultas Ineficientes** | Los agentes necesitan información estructural, no contenido de archivos |

### Ejemplo Comparativo

Si un agente de IA necesita entender dónde se define un componente en un proyecto React:

| Método | Tokens Consumidos |
|--------|-------------------|
| **Tradicional** (leer todos los archivos en `src/`) | 10,000+ tokens |
| **Context Mapper** (estructura de directorios) | < 100 tokens |

**Reducción de consumo: 99%**

---

## La Solución: Inteligencia Estructural

Context Mapper implementa un enfoque de **"mapa sobre territorio"**. En lugar de proporcionar contenido de archivos en bruto, ofrece metadatos estructurados que responden preguntas específicas sobre organización y dependencias del proyecto.

### Propuesta de Valor

| Beneficio | Descripción |
|-----------|-------------|
| **Velocidad** | Sin overhead de lectura de archivos para consultas estructurales |
| **Ahorro de Costos** | Reducción de consumo de tokens del 99% para tareas de navegación |
| **Precisión** | Solo se retornan datos estructurales relevantes |
| **Escalabilidad** | Funciona con codebases grandes que exceden límites de contexto |

---

## Arquitectura del Sistema

Context Mapper implementa la especificación del Model Context Protocol, exponiendo herramientas a través de una arquitectura de servidor MCP estándar. El servidor se ejecuta como proceso local, comunicándose con clientes MCP vía transporte stdio.

### Diagrama de Arquitectura

```
┌─────────────────────┐        stdio         ┌────────────────────────┐
│    Cliente MCP      │◄────────────────────►│   Context Mapper       │
│   (Agente de IA)    │   JSON-RPC stdin/    │   Server v1.0.0        │
│                     │   stdout             │                        │
│  • Claude Desktop   │                      │  ┌──────────────────┐  │
│  • VS Code          │                      │  │ Request Handlers │  │
│  • Extensiones IDE  │                      │  └────────┬─────────┘  │
└─────────────────────┘                      │           │            │
                                             │  ┌────────┴─────────┐  │
                                             │  │                  │  │
                                             │  ▼                  ▼  │
                                             │ ┌────────┐  ┌────────┐ │
                                             │ │get_file│  │analyze_│ │
                                             │ │structure│  │imports │ │
                                             │ └────┬───┘  └────┬───┘ │
                                             │      │           │     │
                                             │      ▼           ▼     │
                                             │  fs.readdir  fs.readFile│
                                             │  + recursión + regex   │
                                             └────────────────────────┘
                                                        │
                                                        ▼
                                             ┌────────────────────────┐
                                             │   Sistema de Archivos  │
                                             │        Local           │
                                             └────────────────────────┘
```

### Protocolo de Comunicación

Context Mapper utiliza el mecanismo de transporte `stdio` definido por la especificación MCP. Los clientes envían solicitudes en formato JSON-RPC vía stdin, y el servidor responde vía stdout.

**Flujo de Solicitudes:**

1. El cliente envía `ListToolsRequest` para descubrir herramientas disponibles
2. El servidor responde con definiciones de herramientas incluyendo esquemas
3. El cliente envía `CallToolRequest` con nombre de herramienta y argumentos
4. El servidor valida argumentos usando esquemas Zod
5. El servidor ejecuta lógica de la herramienta y retorna respuesta estructurada

### Componentes Principales

| Componente | Tipo | Ubicación | Descripción |
|------------|------|-----------|-------------|
| Server | Instancia MCP | src/index.ts | Instancia principal usando @modelcontextprotocol/sdk |
| StdioServerTransport | Transporte | src/index.ts | Maneja comunicación stdin/stdout |
| get_file_structure | Herramienta | src/index.ts | Genera estructuras de árbol de directorios |
| analyze_imports | Herramienta | src/index.ts | Extrae declaraciones import de archivos |
| generateTree | Función | src/index.ts | Implementación de recorrido recursivo de directorios |
| ignoredFolders | Set | src/index.ts | Carpetas a excluir de la salida de estructura |

---

## Herramientas Principales

Context Mapper proporciona exactamente dos herramientas, cada una optimizada para un tipo específico de consulta de comprensión de código.

### Resumen de Herramientas

| Herramienta | Propósito | Formato de Salida | Casos de Uso |
|-------------|-----------|-------------------|--------------|
| `get_file_structure` | Visualización de árbol de directorios | Texto con caracteres `├──` y `└──` | "Muéstrame el layout del proyecto", "¿Qué hay en la carpeta src?" |
| `analyze_imports` | Extracción de declaraciones import | Array JSON de objetos `{module, code}` | "¿Qué dependencias usa este archivo?", "¿De dónde viene este import?" |

---

### `get_file_structure`

Genera una vista tipo `tree` de la estructura de directorios, similar al comando Unix `tree`.

#### Parámetros

| Parámetro | Tipo | Default | Requerido | Descripción |
|-----------|------|---------|-----------|-------------|
| `path` | `string` | `.` | No | Directorio base para iniciar el recorrido |
| `depth` | `number` | `2` | No | Niveles de profundidad para recorrer |

#### Comportamiento

- **Ordenamiento:** Directorios primero, luego archivos, ambos alfabéticamente
- **Filtrado:** Ignora automáticamente carpetas de ruido
- **Recursión:** Controlada por parámetro `depth`
- **Indicadores:** Directorios marcados con `/` al final

#### Carpetas Ignoradas

La herramienta excluye automáticamente las siguientes carpetas:

| Carpeta | Razón |
|---------|-------|
| `node_modules` | Dependencias de paquetes |
| `.git` | Metadatos de control de versiones |
| `.next` | Salida de build de Next.js |
| `.venv` | Entornos virtuales de Python |
| `dist` | Artefactos de build |
| `.gemini` | Configuración de herramientas AI |

#### Ejemplo de Salida

```
Directory structure for /home/user/my-project:

├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Header.tsx
│   ├── utils/
│   │   └── helpers.ts
│   └── index.ts
├── tests/
│   └── app.test.ts
├── package.json
├── README.md
└── tsconfig.json
```

---

### `analyze_imports`

Extrae las declaraciones `import` de un archivo JavaScript/TypeScript usando análisis basado en regex.

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `filepath` | `string` | ✓ | Ruta absoluta o relativa al archivo a analizar |

#### Regex Utilizado

```regex
/^\s*import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/gm
```

#### Desglose del Patrón

| Segmento | Función |
|----------|---------|
| `^\s*` | Inicio de línea con espacios opcionales |
| `import` | Palabra clave import literal |
| `\s+` | Al menos un espacio después de import |
| `(?:[\w\s{},*]+\s+from\s+)?` | Cláusula opcional de named/default imports |
| `['"]([^'"]+)['"]` | Captura la ruta del módulo entre comillas |
| `gm` | Flags: global y multilínea |

#### Tipos de Import Soportados

| Tipo | Ejemplo | Soportado |
|------|---------|-----------|
| Named imports | `import { foo } from 'bar'` | ✓ |
| Default imports | `import foo from 'bar'` | ✓ |
| Namespace imports | `import * as foo from 'bar'` | ✓ |
| Side-effect imports | `import 'styles.css'` | ✓ |
| Mixed imports | `import foo, { bar } from 'baz'` | ✓ |

#### Ejemplo de Salida

```json
[
  {
    "module": "@modelcontextprotocol/sdk/server/index.js",
    "code": "import { Server } from \"@modelcontextprotocol/sdk/server/index.js\""
  },
  {
    "module": "fs/promises",
    "code": "import fs from \"fs/promises\""
  },
  {
    "module": "./utils",
    "code": "import { helper } from \"./utils\""
  }
]
```

---

## Guía de Instalación

### Prerrequisitos

| Requisito | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | v16 o superior | Entorno de ejecución para el servidor compilado |
| npm | Incluido con Node.js | Gestor de paquetes para instalar dependencias |
| Git | Cualquier versión reciente | Para clonar el repositorio |
| Cliente MCP | Cualquier cliente compatible | Interfaz para comunicarse con el servidor |

### Proceso de Instalación

La fase de instalación transforma el código fuente TypeScript en un servidor Node.js ejecutable.

#### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/gaboLectric/MCP_context-mapper
cd MCP_context-mapper
```

#### Paso 2: Instalar Dependencias

```bash
npm install
```

Este comando lee las dependencias de `package.json` y descarga:

| Paquete | Propósito |
|---------|-----------|
| `@modelcontextprotocol/sdk` | Implementación del protocolo MCP |
| `zod` | Librería de validación de esquemas |
| `typescript` | Compilador para transformar TypeScript a JavaScript |
| `@types/node` | Definiciones de tipos para APIs de Node.js |

#### Paso 3: Compilar TypeScript

```bash
npm run build
```

Este comando ejecuta el compilador `tsc`, que lee la configuración de `tsconfig.json` y produce salida de módulos ES2022 en el directorio `dist/`.

#### Paso 4: Verificar Compilación

```bash
ls dist/
# Debería mostrar: index.js
```

---

## Configuración de Clientes MCP

Una vez compilado, el servidor debe registrarse con un cliente MCP a través de configuración.

### Ubicación de Archivos de Configuración

| Sistema Operativo | Cliente | Ruta del Archivo |
|-------------------|---------|------------------|
| macOS | Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | Claude Desktop | `~/.config/Claude/claude_desktop_config.json` |

### Ejemplo de Configuración

```json
{
  "mcpServers": {
    "context-mapper": {
      "command": "node",
      "args": ["/ruta/absoluta/a/MCP_context-mapper/dist/index.js"]
    }
  }
}
```

**Importante:** La ruta debe ser **absoluta** y apuntar al archivo `dist/index.js` (JavaScript compilado, no TypeScript).

### Verificación de Instalación

Después de configurar y reiniciar el cliente:

1. **Descubrimiento de Herramientas:** El cliente MCP debería mostrar las dos herramientas de Context Mapper
2. **Ejecución de Prueba:** Probar funcionalidad básica con una consulta simple

#### Lista de Verificación

| Verificación | Resultado Esperado |
|--------------|-------------------|
| Herramientas visibles en cliente | `get_file_structure` y `analyze_imports` listadas |
| Ejecución de `get_file_structure` | Árbol de directorios retornado |
| Ejecución de `analyze_imports` | Array JSON de imports retornado |

#### Solución de Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| Herramientas no visibles | Ruta incorrecta | Verificar ruta absoluta a `dist/index.js` |
| Servidor no inicia | Proceso falló | Revisar logs del cliente |
| Error de sintaxis | JSON inválido | Validar archivo de configuración |

---

## Referencia de API

### Esquemas de Herramientas

#### `get_file_structure` Schema

```json
{
  "name": "get_file_structure",
  "description": "Obtener una vista de pájaro de la estructura de archivos, similar al comando 'tree'.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Ruta del directorio base (default: directorio actual)"
      },
      "depth": {
        "type": "number",
        "description": "Profundidad de recursión (default: 2)"
      }
    }
  }
}
```

#### `analyze_imports` Schema

```json
{
  "name": "analyze_imports",
  "description": "Analizar imports en un archivo específico para entender sus dependencias.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "filepath": {
        "type": "string",
        "description": "Ruta al archivo a analizar"
      }
    },
    "required": ["filepath"]
  }
}
```

### Formatos de Respuesta

#### Respuesta Exitosa de `get_file_structure`

```json
{
  "content": [
    {
      "type": "text",
      "text": "Directory structure for /path/to/project:\n\n├── src/\n│   └── index.ts\n└── package.json"
    }
  ]
}
```

#### Respuesta Exitosa de `analyze_imports`

```json
{
  "content": [
    {
      "type": "text",
      "text": "[\n  {\n    \"module\": \"react\",\n    \"code\": \"import React from \\\"react\\\"\"\n  }\n]"
    }
  ]
}
```

#### Respuesta de Error

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: File not found at /path/to/missing-file.ts"
    }
  ],
  "isError": true
}
```

---

## Patrones de Uso

### Patrón 1: Comprensión Top-Down del Proyecto

1. El agente de IA se conecta al servidor Context Mapper
2. Ejecuta `get_file_structure` con `path: ".", depth: 2`
3. Recibe estructura de alto nivel (ej: `src/`, `tests/`, `config/`)
4. Ejecuta `get_file_structure` con `path: "src", depth: 3` para detalles
5. Identifica archivo de interés (ej: `src/controllers/UserController.ts`)
6. Ejecuta `analyze_imports` en ese archivo
7. Entiende dependencias sin leer contenido completo

### Patrón 2: Investigación de Dependencias

1. El agente necesita entender qué importa un componente
2. Ejecuta `analyze_imports` con `filepath: "src/App.tsx"`
3. Recibe array JSON de todas las declaraciones import
4. Analiza dependencias externas vs. módulos internos
5. Proporciona al usuario resumen de dependencias

### Patrón 3: Explicación de Arquitectura

1. Usuario pregunta: "Explica la arquitectura de este proyecto"
2. El agente ejecuta `get_file_structure` con parámetros por defecto
3. Analiza estructura de carpetas para identificar patrones (MVC, capas, etc.)
4. Proporciona explicación arquitectónica basada en organización de directorios
5. Usa tokens mínimos comparado con leer todos los archivos

---

## Manejo de Errores

### Tabla de Errores

| Escenario | Herramienta | Respuesta |
|-----------|-------------|-----------|
| Formato de ruta inválido | get_file_structure | Error de validación Zod antes de ejecución |
| Ruta no es directorio | get_file_structure | `Error: {path} is not a directory` |
| Valor de depth inválido | get_file_structure | Error de validación Zod (debe ser número) |
| Archivo no encontrado | analyze_imports | `Error: File not found at {path}` |
| Formato de filepath inválido | analyze_imports | Error de validación Zod antes de ejecución |
| Permiso de lectura denegado | Ambas | Error del sistema propagado al cliente |
| Herramienta desconocida | N/A | `Error: Unknown tool: {name}` |

---

## Requisitos del Sistema

### Prerrequisitos

| Requisito | Especificación |
|-----------|----------------|
| Node.js | v16.0.0 o superior |
| Cliente MCP | Cualquier cliente compatible (ej: Claude Desktop, extensiones VS Code) |
| Sistema Operativo | macOS, Windows, o Linux |
| Espacio en Disco | < 10 MB para salida compilada |

### Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Lenguaje | TypeScript | ^5.3.3 | Desarrollo type-safe |
| Runtime | Node.js | v16+ | Ejecución de JavaScript |
| SDK del Protocolo | @modelcontextprotocol/sdk | ^0.6.0 | Implementación MCP |
| Validación | zod | ^3.23.8 | Validación de esquemas |
| Sistema de Archivos | fs/promises | Built-in | Operaciones async de archivos |
| Utilidades de Rutas | path | Built-in | Manejo de rutas multiplataforma |
| Transporte | stdio | Built-in | Comunicación entre procesos |

### Restricciones Arquitectónicas

1. **Ejecución single-threaded:** Todas las operaciones corren en el event loop de Node.js
2. **Solo acceso a sistema de archivos local:** Sin operaciones de red o recursos remotos
3. **Operaciones de solo lectura:** Sin capacidades de modificación de archivos
4. **Protocolo basado en texto:** Toda comunicación vía JSON sobre stdio
5. **Diseño stateless:** Cada solicitud es independiente, sin gestión de sesiones

---

## Estructura del Proyecto

```
MCP_context-mapper/
├── .github/
│   └── copilot-instructions.md    # Instrucciones para GitHub Copilot
├── src/
│   └── index.ts                   # Código fuente principal
├── dist/                          # Salida compilada (generada)
│   └── index.js
├── .gitignore
├── DOCUMENTATION.md               # Este documento
├── package.json                   # Configuración del proyecto
├── package-lock.json
├── README.md                      # Guía de inicio rápido
└── tsconfig.json                  # Configuración de TypeScript
```

---

## Información de Versión

**Versión Actual:** v1.0.0

Esta versión inicial proporciona funcionalidad core para visualización de estructura de directorios y análisis de imports. El sistema está listo para producción y se usa activamente con Claude Desktop y otros clientes MCP.

### Características de la Versión

- API estable con esquemas de herramientas definidos
- Implementación de protocolo MCP compatible hacia atrás
- Salida de módulos ES2022
- Verificación estricta de tipos TypeScript
- Licencia ISC

---

## Licencia

ISC License

Copyright (c) 2024 gaboLectric

---

## Enlaces

- **Repositorio:** https://github.com/gaboLectric/MCP_context-mapper
- **Documentación DeepWiki:** https://deepwiki.com/gaboLectric/MCP_context-mapper
