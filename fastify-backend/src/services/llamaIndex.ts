import path from "path";
import { VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";

let index: VectorStoreIndex | null = null;

export function getIndex(): VectorStoreIndex | null {
  return index;
}

export function isIndexInitialized(): boolean {
  return index !== null;
}

export async function initializeIndex(): Promise<boolean> {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    console.warn("WARNING: OPENAI_API_KEY environment variable is not set. LlamaIndex index creation skipped until key is provided.");
    return false;
  }

  try {
    const dataDir = path.resolve(process.cwd(), "data");
    console.log(`Ingesting documents from directory: ${dataDir}`);
    const reader = new SimpleDirectoryReader();
    const documents = await reader.loadData({ directoryPath: dataDir });
    index = await VectorStoreIndex.fromDocuments(documents);
    console.log("LlamaIndex successfully initialized and vectorized documents.");
    return true;
  } catch (error) {
    console.error("Error initializing LlamaIndex:", error);
    return false;
  }
}
