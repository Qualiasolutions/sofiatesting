import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  // Map old model names to current Gemini models
  const modelMapping: Record<string, string> = {
    "chat-model-small": "chat-model-flash-lite",
    "chat-model-medium": "chat-model",
    "chat-model-large": "chat-model-pro",
    "chat-model-code": "chat-model",
    "chat-model-reasoning": "chat-model-pro",
    "chat-model-flagship": "chat-model-pro",
    // Legacy Claude/GPT model names
    "chat-model-gpt4o-mini": "chat-model-flash-lite",
    "chat-model-gpt4o": "chat-model",
    "chat-model-sonnet": "chat-model-pro",
  };

  let selectedModel = DEFAULT_CHAT_MODEL;

  if (modelIdFromCookie) {
    // Check if it's an old model name and map it
    selectedModel =
      modelMapping[modelIdFromCookie.value] || modelIdFromCookie.value;

    // If the model was mapped, update the cookie with the new value
    if (modelMapping[modelIdFromCookie.value]) {
      cookieStore.set("chat-model", selectedModel);
    }
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={selectedModel}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
