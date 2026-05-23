import { useState, useEffect } from 'react';

export function useChatApi(currentUser: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentAgentOnDuty, setCurrentAgentOnDuty] = useState<string | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const fetchHistory = async () => {
    try {
      const url = (currentUser && currentUser.role !== 'admin')
        ? `http://localhost:8000/api/projects/sessions?user_id=${currentUser.role}`
        : "http://localhost:8000/api/projects/sessions";
      const res = await fetch(url);
      const data = await res.json();
      setChatHistory(data);
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const handleSelectSession = async (session: any) => {
    setCurrentSessionId(session.id);
    setIsProcessing(false);
    setCurrentAgentOnDuty(null);
    setActiveAgents([]);

    try {
      const res = await fetch(`http://localhost:8000/api/projects/sessions/${session.id}/messages`);
      const data = await res.json();
      setMessages(data);

      const hasSystemMessage = data.some((m: any) => m.role === 'system');
      setIsRightSidebarOpen(hasSystemMessage);
    } catch (e) {
      console.error("Error loading session:", e);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setCurrentAgentOnDuty(null);
  };

  const handleHire = async (brief: string) => {
    if (!brief.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: brief }]);
    setIsProcessing(true);
    setCurrentAgentOnDuty("Chief Supervisor");
    setActiveAgents([]);

    try {
      const res = await fetch("http://localhost:8000/api/projects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          session_id: currentSessionId,
          user_id: currentUser?.role || "default-user"
        })
      });
      const dataInfo = await res.json();
      setCurrentSessionId(dataInfo.session_id);
      fetchHistory();

      const sse = new EventSource(`http://localhost:8000/api/projects/${dataInfo.session_id}/stream`);

      setMessages(prev => {
        const newIdx = prev.length;
        setIsRightSidebarOpen(true);
        return [...prev, { role: "system", logs: [], status: 'processing', id: newIdx }];
      });

      sse.onmessage = (e) => {
        const data = JSON.parse(e.data);

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === "system") {
            const isDuplicate = lastMsg.logs.find((l: any) => l.message === data.message);
            if (!isDuplicate) {
              lastMsg.logs = [...lastMsg.logs, data];
            }
          }
          return newMessages;
        });

        if (data.event === "working" && data.title) {
          setCurrentAgentOnDuty(data.title);
        } else if (data.event === "routing") {
          setCurrentAgentOnDuty("Chief Supervisor");
        } else if (data.event === "report" && data.title) {
          setCurrentAgentOnDuty(data.title);
        }

        if (data.event === "working" && data.agent) {
          setActiveAgents(prev => Array.from(new Set([...prev, data.agent])));
        }

        if (data.event === "completed") {
          sse.close();
          setIsProcessing(false);
          setCurrentAgentOnDuty(null);
          setActiveAgents([]);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === "system") {
              lastMsg.status = 'completed';
              lastMsg.products = data.products || [];
              lastMsg.narrative = data.narrative || "";
            }
            return newMessages;
          });
        }
      };
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return {
    messages,
    setMessages,
    chatHistory,
    isProcessing,
    activeAgents,
    currentSessionId,
    setCurrentSessionId,
    currentAgentOnDuty,
    isRightSidebarOpen,
    setIsRightSidebarOpen,
    fetchHistory,
    handleSelectSession,
    handleNewChat,
    handleHire
  };
}
