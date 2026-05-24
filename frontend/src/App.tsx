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
  // Load current logged in user persona from local storage (or null if not logged in)
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Load the active portal page from local storage, defaulting to 'chat'
  const [activePortal, setActivePortal] = useState<'chat' | 'admin' | 'order' | 'catalog' | 'history'>(() => {
    const storedPortal = localStorage.getItem('activePortal');
    return (storedPortal as 'chat' | 'admin' | 'order' | 'catalog' | 'history') || 'chat';
  });

  // Load the landing page tab (simulation or catalog) from local storage
  const [landingTab, setLandingTab] = useState<'simulation' | 'catalog'>(() => {
    const storedTab = localStorage.getItem('landingTab');
    return (storedTab as 'simulation' | 'catalog') || 'simulation';
  });

  // Track parameters for catalog filtering to avoid router race conditions
  const [catalogParams, setCatalogParams] = useState<{ category?: string; search?: string } | null>(null);

  // Load cart items from local storage
  const [cartItems, setCartItems] = useState<any[]>(() => {
    const storedCart = localStorage.getItem('cartItems');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  // Helper function to add a selected catalog item to cart
  const addToCart = (product: any) => {
    setCartItems(prev => [...prev, product]);
  };

  // Instantiate the chat API hook with the current logged in user
  const chatApi = useChatApi(currentUser);

  const navigate = useNavigate();
  const location = useLocation();

  // Save current user to local storage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Save active portal to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('activePortal', activePortal);
  }, [activePortal]);

  // Save landing tab to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('landingTab', landingTab);
  }, [landingTab]);

  // Save cart items to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Synchronize state changes to URL route pathname
  useEffect(() => {
    if (!currentUser) {
      if (landingTab === 'catalog') {
        const params = new URLSearchParams();
        if (catalogParams?.category) params.set('category', catalogParams.category);
        if (catalogParams?.search) params.set('search', catalogParams.search);
        const query = params.toString();
        const target = `/catalog${query ? `?${query}` : ''}`;

        if (location.pathname !== '/catalog' || location.search !== (query ? `?${query}` : '')) {
          navigate(target);
        }
      } else {
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    } else {
      const targetPath = `/${activePortal}`;
      if (location.pathname !== targetPath) {
        navigate(`${targetPath}${location.search}`);
      }
    }
    // NOTE: location.pathname intentionally excluded from deps — this effect *writes* to the URL,
    // not reads from it. Including it causes a two-way loop with the route-sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activePortal, landingTab, navigate, catalogParams]);

  // Synchronize URL route pathname changes back to state (e.g. Back/Forward browser navigation)
  useEffect(() => {
    const routePath = location.pathname;
    if (routePath === '/' || routePath === '/landing') {
      setLandingTab('simulation');
      setCatalogParams(null);
    } else if (routePath === '/catalog') {
      if (!currentUser) {
        setLandingTab('catalog');
        const params = new URLSearchParams(location.search);
        const category = params.get('category') || undefined;
        const search = params.get('search') || undefined;
        setCatalogParams({ category, search });
      } else {
        setActivePortal('catalog');
      }
    } else if (['/chat', '/admin', '/order', '/history'].includes(routePath)) {
      const portalName = routePath.substring(1) as 'chat' | 'admin' | 'order' | 'history';
      // Guard: only update if value actually changes to avoid re-triggering the URL-sync effect
      setActivePortal(prev => prev !== portalName ? portalName : prev);
    }
  }, [location.pathname, currentUser, location.search]);

  // Load session from URL parameters if redirected from backend (e.g. direct admin/order links)
  useEffect(() => {
    // Support query strings in both standard location.search and hash fragments
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
        setActivePortal(portalParam as 'order' | 'admin');
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

        // payment_confirmed: reload messages (triggered after order payment)
        if (evtType === 'payment_confirmed' && sid) {
          if (sid === chatApi.currentSessionId) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(data);
            } catch (err) {
              console.error('Failed to reload messages on broadcasted payment confirmation:', err);
            }
          }
        }

        // restock_complete: reload messages only — do NOT navigate (still on admin page)
        // Separate from payment_confirmed to avoid state inconsistency
        if (evtType === 'restock_complete' && sid) {
          if (sid === chatApi.currentSessionId) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              chatApi.setMessages(data);
            } catch (err) {
              console.error('Failed to reload messages on broadcasted restock completion:', err);
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
    if (landingTab === 'catalog') {
      return (
        <MaterialCatalog
          onBack={() => setLandingTab('simulation')}
          onSelectProduct={(p) => { addToCart(p); setActivePortal('order'); }}
        />
      );
    }
    return (
      <LandingPage
        onSelectPersona={(role) => {
          const matchedPersona = PERSONAS.find(p => p.role === role);
          if (matchedPersona) {
            setCurrentUser(matchedPersona);
            setActivePortal(role === 'admin' ? 'admin' : 'chat');
          }
        }}
        onViewCatalog={(categoryId, search) => {
          setCatalogParams({ category: categoryId, search });
          setLandingTab('catalog');
        }}
      />
    );
  }

  if (activePortal === 'history') {
    return (
      <OrderHistory
        chatHistory={chatApi.chatHistory}
        onBack={() => setActivePortal('chat')}
        onDownloadPdf={(sessionId: string) => {
          window.open(`${API_BASE_URL}/api/projects/${sessionId}/generate-pdf`, '_blank');
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
          const originRole = (chatApi.currentSessionId ? localStorage.getItem(`originRole:${chatApi.currentSessionId}`) : null) || localStorage.getItem('originRole');
          if (originRole) {
            const matchedPersona = PERSONAS.find(p => p.role === originRole);
            if (matchedPersona) {
              setCurrentUser(matchedPersona);
            }
            if (chatApi.currentSessionId) {
              localStorage.removeItem(`originRole:${chatApi.currentSessionId}`);
            }
            localStorage.removeItem('originRole');
          }
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
        onBack={() => setActivePortal('chat')}
        onPlaceOrder={async (_orderDetails) => {
          setActivePortal('chat');
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
