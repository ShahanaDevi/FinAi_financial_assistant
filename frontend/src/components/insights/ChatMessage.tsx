import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  recommendations?: string[];
}

const ChatMessage = ({ message, isUser, recommendations }: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary" : "gradient-primary"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary-foreground" />
        )}
      </div>
      <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        <p className="text-sm leading-relaxed">{message}</p>
        {recommendations && recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium mb-2 opacity-80">Recommendations:</p>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-xs flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
