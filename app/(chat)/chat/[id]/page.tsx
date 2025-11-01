import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

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

  if (chatModelFromCookie) {
    // Check if it's an old model name and map it
    selectedModel = modelMapping[chatModelFromCookie.value] || chatModelFromCookie.value;

    // If the model was mapped, update the cookie with the new value
    if (modelMapping[chatModelFromCookie.value]) {
      cookieStore.set("chat-model", selectedModel);
    }
  }

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={selectedModel}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  );
}
