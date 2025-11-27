# 🌟 Context Mapper MCP

**Context Mapper** es tu aliado para que los Agentes de IA entiendan tu proyecto al instante. Olvídate de copiar y pegar miles de líneas de código o de que el agente pierda el contexto.

Diseñado para ser ligero, rápido y ejecutarse localmente, este servidor MCP permite a cualquier asistente (como Claude Desktop o extensiones de IDE) "ver" la estructura de tu proyecto y entender sus dependencias sin leer cada archivo.

## 🎯 Perfecto Para
*   **🔍 Exploración Rápida**: Entiende la arquitectura de un proyecto nuevo en segundos.
*   **🗺️ Mapeo de Dependencias**: Visualiza qué archivos dependen de cuáles librerías.
*   **🤖 Agentes Autónomos**: Dale a tu IA la capacidad de navegar tu código con inteligencia.
*   **⚡ Ahorro de Tokens**: Evita enviar todo el código al contexto; envía solo lo que importa.

## 🚀 Quick Start

### Requisitos
*   Node.js instalado.
*   Un cliente MCP (ej: Claude Desktop).

### Instalación y Ejecución
No necesitas instalar nada globalmente si no quieres. Simplemente clona este repositorio, construye y conecta.

1.  **Clonar y Construir**:
    ```
    git clone https://github.com/gaboLectric/MCP_context-mapper
    cd context-mapper
    npm install
    npm run build
    ```

2.  **Configurar en Claude Desktop**:
    Edita tu archivo de configuración de Claude (usualmente en `~/Library/Application Support/Claude/claude_desktop_config.json` en Mac o `%APPDATA%\Claude\claude_desktop_config.json` en Windows):

    ```json
    {
      "mcpServers": {
        "context-mapper": {
          "command": "node",
          "args": ["/ruta/absoluta/a/context-mapper/dist/index.js"]
        }
      }
    }
    ```

3.  **¡Listo!** ✨ Reinicia Claude y verás las nuevas herramientas disponibles.

## ✨ Características

### 🔥 Core Capabilities

| Herramienta | Descripción | Caso de Uso |
| :--- | :--- | :--- |
| **`get_file_structure`** | 🌳 **Vista de Árbol**: Genera una representación visual de tus carpetas, ignorando ruido como `node_modules`. | "¿Cuál es la estructura de este proyecto?", "Muéstrame los controladores". |
| **`analyze_imports`** | 🔗 **Analizador de Dependencias**: Extrae todos los `imports` de un archivo JS/TS usando Regex de alta precisión. | "¿Qué librerías usa `App.tsx`?", "¿De dónde sale este componente?". |

### 🎯 Consultas de Ejemplo que Funcionan
*   ✅ *"Dame una vista general de la carpeta `src` con profundidad 3"*
*   ✅ *"Analiza los imports de `src/index.ts` para ver sus dependencias"*
*   ✅ *"Explícame la arquitectura basándote en la estructura de archivos"*

## 🔧 Configuración Avanzada

El servidor funciona "out-of-the-box", pero puedes personalizarlo modificando el código fuente en `src/index.ts`.

*   **Ignorar carpetas**: Modifica el `Set` de `ignoredFolders` para añadir o quitar directorios.
*   **Profundidad por defecto**: Cambia el valor por defecto en el esquema de Zod.

## 🤝 Contribuyendo
¡Las contribuciones son bienvenidas!
1.  🐛 Reporta bugs.
2.  💡 Sugiere nuevas características (¡Soporte para Python/Go en camino!).
3.  🔧 Envía PRs.

## 📜 Licencia
ISC
