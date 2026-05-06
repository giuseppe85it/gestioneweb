import ChatIaToolUsePage from "./ChatIaToolUsePage";
import { initToolRegistry } from "./tools";
import "./chatIa.css";

export default function ChatIaPage() {
  initToolRegistry();
  return <ChatIaToolUsePage />;
}
