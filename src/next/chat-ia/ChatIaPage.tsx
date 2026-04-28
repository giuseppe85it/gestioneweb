import ChatIaShell from "./components/ChatIaShell";
import { initToolRegistry } from "./tools";
import "./chatIa.css";

export default function ChatIaPage() {
  initToolRegistry();
  return <ChatIaShell />;
}
