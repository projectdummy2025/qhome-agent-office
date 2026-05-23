import { useState, useEffect } from 'react';
import AdminPortal from './components/AdminPortal';
import OrderPortal from './components/OrderPortal';
import MaterialCatalog from './components/MaterialCatalog';
import OrderHistory from './components/OrderHistory';
import PersonaSelect, { PERSONAS } from './components/canvas/PersonaSelect';
import ChatCanvas from './components/canvas/ChatCanvas';
import { useChatApi } from './hooks/useChatApi';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activePortal, setActivePortal] = useState<'chat' | 'admin' | 'order' | 'catalog' | 'history'>('chat');
  const [landingTab, setLandingTab] = useState<'simulation' | 'catalog'>('simulation');

  const [cartItems, setCartItems] = useState<any[]>([]);
  const addToCart = (product: any) => {
    setCartItems(prev => [...prev, product]);
  };

  const chatApi = useChatApi(currentUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const sessionIdParam = params.get('session_id');
    const userRoleParam = params.get('user_role');

    if ((portalParam === 'order' || portalParam === 'admin') && sessionIdParam && userRoleParam) {
      const matchedPersona = PERSONAS.find(p => p.role === userRoleParam);
      if (matchedPersona) {
        setCurrentUser(matchedPersona);
        chatApi.setCurrentSessionId(sessionIdParam);
        setActivePortal(portalParam as 'order' | 'admin');
        
        fetch(`http://localhost:8000/api/projects/sessions/${sessionIdParam}/messages`)
          .then(res => res.json())
          .then(data => {
            chatApi.setMessages(data);
          })
          .catch(err => console.error("Error loading cart session messages:", err));
      }
    }
  }, []);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel('qhome_payment_channel');
      channel.onmessage = async (event) => {
        if (event.data && event.data.event === 'payment_confirmed' && event.data.sessionId) {
          const sid = event.data.sessionId;
          if (sid === chatApi.currentSessionId) {
            try {
              const res = await fetch(`http://localhost:8000/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(data);
            } catch (err) {
              console.error('Failed to reload messages on broadcasted payment confirmation:', err);
            }
          }
        }
      };
      return () => {
        channel.close();
      };
    } catch (err) {
      console.error('Failed to establish BroadcastChannel:', err);
    }
  }, [chatApi.currentSessionId]);

  if (!currentUser) {
    return (
      <PersonaSelect 
        landingTab={landingTab}
        setLandingTab={setLandingTab}
        setCurrentUser={setCurrentUser}
        setActivePortal={setActivePortal}
        addToCart={addToCart}
      />
    );
  }

  if (activePortal === 'history') {
    return (
      <OrderHistory
        chatHistory={chatApi.chatHistory}
        onBack={() => setActivePortal('chat')}
        onDownloadPdf={(sessionId: string) => {
          window.open(`http://localhost:8000/api/projects/${sessionId}/generate-pdf`, '_blank');
        }}
      />
    );
  }

  if (activePortal === 'catalog') {
    return (
      <MaterialCatalog
        onBack={() => setActivePortal('chat')}
        onSelectProduct={(p) => { addToCart(p); setActivePortal('order'); }}
      />
    );
  }

  if (activePortal === 'admin') {
    const systemMsgsWithProducts = chatApi.messages.filter(m => m.role === 'system' && m.products && m.products.length > 0);
    const products = systemMsgsWithProducts.length > 0 ? systemMsgsWithProducts[systemMsgsWithProducts.length - 1].products : [];
    const userBrief = chatApi.messages.filter(m => m.role === 'user')[0]?.content || "";

    return (
      <AdminPortal
        currentUser={currentUser}
        currentSessionId={chatApi.currentSessionId}
        products={products}
        brief={userBrief}
        onBack={() => {
          if (chatApi.currentSessionId) {
            setActivePortal('chat');
          } else {
            setCurrentUser(null);
          }
        }}
        onUpdateProducts={(newProducts) => {
          chatApi.setMessages(prev => {
            const updated = [...prev];
            const lastSysIdx = updated.map(m => m.role).lastIndexOf('system');
            if (lastSysIdx !== -1) {
              updated[lastSysIdx] = {
                ...updated[lastSysIdx],
                products: newProducts
              };
            }
            return updated;
          });
        }}
      />
    );
  }

  if (activePortal === 'order') {
    const systemMsgsWithProducts = chatApi.messages.filter(m => m.role === 'system' && m.products && m.products.length > 0);
    const products = systemMsgsWithProducts.length > 0 ? systemMsgsWithProducts[systemMsgsWithProducts.length - 1].products : [];
    const userBrief = chatApi.messages.filter(m => m.role === 'user')[0]?.content || "";

    return (
      <OrderPortal
        currentUser={currentUser}
        currentSessionId={chatApi.currentSessionId}
        products={cartItems.length > 0 ? cartItems.map((p: any) => ({
          sku: p.sku,
          name: p.name,
          price: p.base_price || p.price || 0,
          qty: 1,
          total: (p.base_price || p.price || 0) * 1,
          category: p.category
        })) : products}
        brief={userBrief}
        onBack={() => setActivePortal('chat')}
        onPlaceOrder={async (_orderDetails) => {
          setActivePortal('chat');
          if (chatApi.currentSessionId) {
            try {
              const res = await fetch(`http://localhost:8000/api/projects/sessions/${chatApi.currentSessionId}/messages`);
              const data = await res.json();
              chatApi.setMessages(data);
            } catch (err) {
              console.error('Failed to reload messages after payment:', err);
            }
          }
        }}
      />
    );
  }

  return (
    <ChatCanvas 
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      setActivePortal={setActivePortal}
      cartItems={cartItems}
      messages={chatApi.messages}
      chatHistory={chatApi.chatHistory}
      isProcessing={chatApi.isProcessing}
      currentSessionId={chatApi.currentSessionId}
      currentAgentOnDuty={chatApi.currentAgentOnDuty}
      isRightSidebarOpen={chatApi.isRightSidebarOpen}
      setIsRightSidebarOpen={chatApi.setIsRightSidebarOpen}
      handleSelectSession={chatApi.handleSelectSession}
      handleNewChat={chatApi.handleNewChat}
      handleHire={chatApi.handleHire}
      activeAgents={chatApi.activeAgents}
    />
  );
}
