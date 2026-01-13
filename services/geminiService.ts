import { GoogleGenAI, Type } from "@google/genai";
import { AiResponseItem, BentoType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBentoLayout = async (prompt: string, gridColumns: number, imageBase64?: string): Promise<AiResponseItem[]> => {
  try {
    const isVisionRequest = !!imageBase64;
    
    // Construct the parts array for the API
    const parts: any[] = [];
    
    if (isVisionRequest) {
        // Strip the data:image/png;base64, prefix
        const cleanBase64 = imageBase64?.split(',')[1] || imageBase64 || "";
        
        parts.push({
            inlineData: {
                mimeType: "image/png", 
                data: cleanBase64
            }
        });
        
        parts.push({
            text: `Actúa como un Desarrollador Frontend Senior experto en reconstruir diseños.
            
            OBJETIVO: Clonar la estructura visual de la imagen proporcionada y mapearla a un Bento Grid de ${gridColumns} columnas.
            
            INSTRUCCIONES PRECISAS DE CLONADO:
            1. Analiza la topología de la imagen. Imagina una grilla de ${gridColumns} columnas superpuesta.
            2. Para cada "caja" o elemento visualmente distinto en la imagen, genera un item.
            3. CALCULA 'colSpan': ¿Cuántas de las ${gridColumns} columnas ocupa este elemento? (Ej: Si ocupa la mitad del ancho, colSpan = ${Math.floor(gridColumns/2)}).
            4. CALCULA 'rowSpan': Estima la altura relativa. Usa valores entre 2 y 12.
            5. Título y Contenido: Extrae el texto real si es legible. Si no, describe brevemente la función (ej: "Navigation", "Chart", "User Profile").
            6. Tipo: Si parece una foto o gráfico complejo -> 'image'. Si es un número grande -> 'stat'. Texto plano -> 'text'.
            7. Color: Extrae el color hexadecimal exacto del fondo del elemento.
            
            Contexto extra del usuario: "${prompt}"`
        });
    } else {
        parts.push({
            text: `Eres un experto en UX/UI y Bento Grids.
            Tu tarea: Crear una configuración de grid basada en el input: "${prompt}".
            
            SI EL INPUT ES UNA URL (http...):
            1. Usa la herramienta 'googleSearch' para analizar el sitio.
            2. Identifica: Logo/Marca (Color principal), Propuesta de valor (H1), Features principales (3-4 items), Call to Action.
            3. TRADUCE ESO A UN BENTO GRID.
               - El H1/Hero debe ser un item grande (colSpan alto).
               - Las features son items medianos.
               - El CTA o datos de "social proof" son items pequeños (stats).
            
            SI ES TEXTO GENERÁL:
            Diseña un layout temático atractivo usando el sistema de ${gridColumns} columnas.
            
            REGLAS TÉCNICAS:
            - Grid System: ${gridColumns} columnas.
            - Total de items: Entre 5 y 9.
            - Asegura que los items encajen visualmente (tetris).
            - Usa colores modernos y alto contraste.`
        });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        // Enable search ONLY if it's text-based (likely a URL or topic)
        tools: isVisionRequest ? undefined : [{googleSearch: {}}],
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              colSpan: { type: Type.INTEGER },
              rowSpan: { type: Type.INTEGER },
              type: { type: Type.STRING, enum: ['text', 'stat', 'image'] },
              colorTheme: { type: Type.STRING, description: "Color HEX background" }
            },
            required: ["title", "content", "colSpan", "rowSpan", "type", "colorTheme"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");

    return JSON.parse(jsonText) as AiResponseItem[];

  } catch (error) {
    console.error("Error generating bento layout:", error);
    return [
      { title: "Error", content: "No se pudo procesar. Intenta con otra imagen o enlace.", colSpan: gridColumns, rowSpan: 4, type: "text", colorTheme: "#333" }
    ];
  }
};