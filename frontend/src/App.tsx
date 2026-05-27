import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPortal from './components/AdminPortal';
import { API_BASE_URL } from './config';
import OrderPortal from './components/OrderPortal';
import MaterialCatalog from './components/MaterialCatalog';
import OrderHistory from './components/OrderHistory';
import { PERSONAS } from './components/canvas/PersonaSelect';
import ChatCanvas from './components/canvas/ChatCanvas';
import LandingPage from './components/landing/LandingPage';
import { useChatApi } from './hooks/useChatApi';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [cartItems, setCartItems] = useState<any[]>(() => {
    const storedCart = localStorage.getItem('cartItems');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const addToCart = (product: any) => {
    setCartItems(prev => [...prev, product]);
  };

  const chatApi = useChatApi(currentUser);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Guard: redirect unauthenticated users away from protected routes.
  // Logged-in users at '/' fall through to the default ChatCanvas render — no redirect needed.
  useEffect(() => {
    const protectedPaths = ['/chat', '/admin', '/order', '/history'];
    if (!currentUser && protectedPaths.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  // Load session from URL parameters if redirected from backend (e.g. direct admin/order links)
  useEffect(() => {
    const searchString = window.location.search || window.location.hash.split('?')[1] || '';
    const params = new URLSearchParams(searchString);
    const portalParam = params.get('portal');
    const sessionIdParam = params.get('session_id');
    const userRoleParam = params.get('user_role');
    const originRoleParam = params.get('origin_role');

    if ((portalParam === 'order' || portalParam === 'admin') && sessionIdParam && userRoleParam) {
      const matchedPersona = PERSONAS.find(p => p.role === userRoleParam);
      if (matchedPersona) {
        setCurrentUser(matchedPersona);
        chatApi.setCurrentSessionId(sessionIdParam);
        navigate(`/${portalParam}`, { replace: true });
        if (originRoleParam) {
          localStorage.setItem('originRole', originRoleParam);
          localStorage.setItem(`originRole:${sessionIdParam}`, originRoleParam);
        }

        fetch(`${API_BASE_URL}/api/projects/sessions/${sessionIdParam}/messages`)
          .then(res => res.json())
          .then(data => {
            chatApi.setMessages(data);
          })
          .catch(err => console.error("Error loading cart session messages from URL:", err));
      }
    }
  }, []);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel('qhome_payment_channel');
      channel.onmessage = async (event) => {
        const { event: evtType, sessionId: sid } = event.data || {};

        if (evtType === 'payment_confirmed' && sid) {
          if (sid === chatApi.currentSessionId) {
            // Freeze the chat for this session
            chatApi.setIsChatFrozen(true);
            try {
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.status === 'processing') {
                  return [...data, lastMsg];
                }
                return data;
              });
            } catch (err) {
              console.error('Failed to reload messages on broadcasted payment confirmation:', err);
            }
          }
        }

        // restock_complete: reload messages only — do NOT navigate (still on admin page)
        if (evtType === 'restock_complete' && sid) {
          if (sid === chatApi.currentSessionId) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.status === 'processing') {
                  return [...data, lastMsg];
                }
                return data;
              });
            } catch (err) {
              console.error('Failed to reload messages on broadcasted restock completion:', err);
            }
          }
        }

        // admin_intervention_needed: ada produk OOS/terbatas — notifikasi ke admin portal
        if (evtType === 'admin_intervention_needed' && sid) {
          // Jika yang menerima adalah role admin → muat sesi & navigasi ke /admin
          const storedUser = localStorage.getItem('currentUser');
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          if (parsedUser?.role === 'admin') {
            try {
              chatApi.setCurrentSessionId(sid);
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(data);
              navigate('/admin', { replace: false });
            } catch (err) {
              console.error('Failed to load session for admin intervention:', err);
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

  const pathname = location.pathname;

  // Unauthenticated routes
  if (!currentUser) {
    if (pathname === '/catalog') {
      // MaterialCatalog reads category/search directly from URL via useSearchParams()
      return (
        <MaterialCatalog
          onBack={() => navigate('/')}
          onSelectProduct={(p) => addToCart(p)}
        />
      );
    }
    return (
      <LandingPage
        onSelectPersona={(role) => {
          const matchedPersona = PERSONAS.find(p => p.role === role);
          if (matchedPersona) {
            setCurrentUser(matchedPersona);
            navigate(role === 'admin' ? '/admin' : '/chat', { replace: true });
          }
        }}
        onViewCatalog={(categoryId, search) => {
          const params = new URLSearchParams();
          if (categoryId) params.set('category', categoryId);
          if (search) params.set('search', search);
          const query = params.toString();
          navigate(`/catalog${query ? `?${query}` : ''}`);
        }}
      />
    );
  }

  // Authenticated routes — derived from URL
  if (pathname === '/history') {
    return (
      <OrderHistory
        chatHistory={chatApi.chatHistory}
        onBack={() => navigate('/chat')}
        onDownloadPdf={(sessionId: string) => {
          window.open(`${API_BASE_URL}/api/projects/${sessionId}/generate-pdf`, '_blank');
        }}
      />
    );
  }

  if (pathname === '/catalog') {
    return (
      <MaterialCatalog
        onBack={() => navigate('/chat')}
        onSelectProduct={(p) => { addToCart(p); navigate('/order'); }}
      />
    );
  }

  if (pathname === '/admin') {
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
          window.close();
          setTimeout(() => {
            setCurrentUser(null);
            chatApi.setCurrentSessionId(null);
            navigate('/', { replace: true });
          }, 300);
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

  if (pathname === '/order') {
    const systemMsgsWithProducts = chatApi.messages.filter(m => m.role === 'system' && m.products && m.products.length > 0);
    const products = systemMsgsWithProducts.length > 0 ? systemMsgsWithProducts[systemMsgsWithProducts.length - 1].products : [];

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
        onBack={() => navigate('/chat')}
        onPlaceOrder={async (_orderDetails) => {
          navigate('/chat');
          if (chatApi.currentSessionId) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${chatApi.currentSessionId}/messages`);
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

  // Default: /chat and any unknown authenticated route falls back to ChatCanvas
  return (
    <ChatCanvas
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      setActivePortal={(portal) => navigate(`/${portal}`)}
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
      isChatFrozen={chatApi.isChatFrozen}
    />
  );
}
