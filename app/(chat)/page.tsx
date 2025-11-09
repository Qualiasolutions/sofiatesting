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

  // Map old model names to new ones
  const modelMapping: Record<string, string> = {
    "chat-model-small": "chat-model-gpt4o-mini",
    "chat-model-medium": "chat-model-gpt4o",
    "chat-model-large": "chat-model-sonnet",
    "chat-model-code": "chat-model-gpt4o",
    "chat-model-reasoning": "chat-model-sonnet",
    "chat-model-flagship": "chat-model-sonnet",
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
