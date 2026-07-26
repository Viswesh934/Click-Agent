import path from "path";
import { VectorStoreIndex, SimpleDirectoryReader, Settings, DeepSeekLLM, HuggingFaceEmbedding } from "llamaindex";

let index: VectorStoreIndex | null = null;

export function getIndex(): VectorStoreIndex | null {
  return index;
}

export function isIndexInitialized(): boolean {
  return index !== null;
}

export async function initializeIndex(): Promise<boolean> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: DEEPSEEK_API_KEY environment variable is not set. LlamaIndex index creation skipped until key is provided.");
    return false;
  }

  try {
    const model = (process.env.DEEPSEEK_MODEL as any) || "deepseek-chat";
    console.log(`Initializing LlamaIndex with DeepSeek model: ${model}`);

    // Configure DeepSeek LLM
    Settings.llm = new DeepSeekLLM({
      apiKey,
      model,
    });

    // Configure HuggingFace local embedding model
    Settings.embedModel = new HuggingFaceEmbedding();

    const dataDir = path.resolve(process.cwd(), "data");
    console.log(`Ingesting documents from directory: ${dataDir}`);
    const reader = new SimpleDirectoryReader();
    const documents = await reader.loadData({ directoryPath: dataDir });
    index = await VectorStoreIndex.fromDocuments(documents);
    console.log("LlamaIndex successfully initialized with DeepSeek API and vectorized documents.");
    return true;
  } catch (error) {
    console.error("Error initializing LlamaIndex with DeepSeek API:", error);
    return false;
  }
}
